using BoerIT.Core.Interfaces;
using BoerIT.Core.Models;
using BoerIT.Service.Interfaces;

namespace BoerIT.Service.Services;

/// <summary>
/// Generates year-by-year financial and herd forecasts based on farm parameters
/// and the livestock production model.
/// </summary>
public class ForecastService(
    IFarmRepository farmRepository,
    IParameterRepository parameterRepository,
    IForecastRepository forecastRepository) : IForecastService
{
    public async Task<IEnumerable<Forecast>> GetForecastsAsync(Guid farmId, Guid userId)
    {
        await AssertOwnershipAsync(farmId, userId);
        return await forecastRepository.GetByFarmIdAsync(farmId);
    }

    public async Task<Forecast?> GetForecastAsync(Guid forecastId, Guid farmId, Guid userId)
    {
        await AssertOwnershipAsync(farmId, userId);
        return await forecastRepository.GetByIdAsync(forecastId);
    }

    public async Task<Forecast> GenerateForecastAsync(Guid farmId, Guid userId, int forecastYears)
    {
        await AssertOwnershipAsync(farmId, userId);

        // Load all inputs
        var parameters = (await parameterRepository.GetByFarmIdAsync(farmId)).ToList();
        var livestockGroups = (await parameterRepository.GetLivestockGroupsAsync(farmId)).ToList();
        var paramDict = parameters.ToDictionary(p => p.ParameterKey, p => p.ParameterValue);

        // Scaffold forecast record
        var forecast = new Forecast
        {
            Id = Guid.NewGuid(),
            FarmId = farmId,
            GeneratedAt = DateTime.UtcNow,
            BaseYear = DateTime.UtcNow.Year,
            ForecastYears = forecastYears,
            Status = "pending",
            Years = []
        };

        // Run the year-by-year model
        var herdState = BuildInitialHerdState(livestockGroups);

        for (int i = 0; i < forecastYears; i++)
        {
            int year = forecast.BaseYear + i;
            var (yearResult, nextHerdState) = SimulateYear(year, herdState, paramDict);
            forecast.Years.Add(yearResult);
            herdState = nextHerdState;
        }

        forecast.Status = "completed";

        return await forecastRepository.CreateAsync(forecast);
    }

    public async Task<bool> DeleteForecastAsync(Guid forecastId, Guid farmId, Guid userId)
    {
        await AssertOwnershipAsync(farmId, userId);
        return await forecastRepository.DeleteAsync(forecastId);
    }

    // ── Forecast Engine ───────────────────────────────────────────────────────

    /// <summary>
    /// Converts current livestock groups into a mutable herd state dictionary
    /// keyed by "{species}_{category}".
    /// </summary>
    private static Dictionary<string, int> BuildInitialHerdState(List<LivestockGroup> groups) =>
        groups.ToDictionary(g => $"{g.Species}_{g.Category}", g => g.CurrentCount);

    /// <summary>
    /// Simulates one year of farm operations.
    /// Returns the ForecastYear result and the updated herd state for the next year.
    ///
    /// TODO: Expand each section as production model details are confirmed:
    ///   - Reproduction rates per species/category
    ///   - Offtake targets (lambs, tollies, ox, old ewes, old cows)
    ///   - Feed cost models (hay, lick, grazing capacity)
    ///   - Labour cost model
    ///   - Veterinary cost model
    ///   - Market price per kg / per head
    /// </summary>
    private static (ForecastYear year, Dictionary<string, int> nextHerdState) SimulateYear(
        int year,
        Dictionary<string, int> herdState,
        Dictionary<string, string> paramDict)
    {
        var lineItems = new List<ForecastLineItem>();
        var nextHerd = new Dictionary<string, int>(herdState);

        // ── Cattle production ─────────────────────────────────────────────

        var cowCount = herdState.GetValueOrDefault("cattle_cow", 0);
        var calvingRate = GetDecimalParam(paramDict, "cattle_calving_rate_pct", 85m) / 100m;
        var calvesborn = (int)(cowCount * calvingRate);
        var calfMortality = GetDecimalParam(paramDict, "cattle_calf_mortality_pct", 3m) / 100m;
        var calvesAlive = (int)(calvesborn * (1 - calfMortality));

        // Offtake: tollies sold at ~18 months — approximated as half of prior year calves
        var tolliesAvailable = herdState.GetValueOrDefault("cattle_tolly", 0);
        var tollySalePrice = GetDecimalParam(paramDict, "cattle_tolly_price_per_head", 8500m);
        var tolliesSold = (int)(tolliesAvailable * 0.8m); // sell 80% of available tollies

        if (tolliesSold > 0)
        {
            lineItems.Add(new ForecastLineItem
            {
                Id = Guid.NewGuid(),
                Category = "Cattle Sales",
                Description = "Tollies sold",
                Quantity = tolliesSold,
                UnitPrice = tollySalePrice,
                Amount = tolliesSold * tollySalePrice,
                Type = "income"
            });
        }

        // Update herd: new calves become next year's tollies
        nextHerd["cattle_tolly"] = calvesAlive;

        // ── Sheep production ──────────────────────────────────────────────

        var eweCount = herdState.GetValueOrDefault("sheep_ewe", 0);
        var lambingRate = GetDecimalParam(paramDict, "sheep_lambing_rate_pct", 90m) / 100m;
        var lambsMortality = GetDecimalParam(paramDict, "sheep_lamb_mortality_pct", 5m) / 100m;
        var lambsAlive = (int)(eweCount * lambingRate * (1 - lambsMortality));

        var lambSalePrice = GetDecimalParam(paramDict, "sheep_lamb_price_per_head", 1200m);
        var lambsSold = (int)(lambsAlive * 0.7m); // sell 70% of lambs

        if (lambsSold > 0)
        {
            lineItems.Add(new ForecastLineItem
            {
                Id = Guid.NewGuid(),
                Category = "Sheep Sales",
                Description = "Lambs sold",
                Quantity = lambsSold,
                UnitPrice = lambSalePrice,
                Amount = lambsSold * lambSalePrice,
                Type = "income"
            });
        }

        nextHerd["sheep_lamb"] = lambsAlive - lambsSold;

        // ── Operating costs ───────────────────────────────────────────────

        var totalAnimalUnits = CalculateTotalAnimalUnits(herdState);
        var feedCostPerAU = GetDecimalParam(paramDict, "feed_cost_per_animal_unit", 1200m);
        var feedCost = totalAnimalUnits * feedCostPerAU;

        lineItems.Add(new ForecastLineItem
        {
            Id = Guid.NewGuid(),
            Category = "Feed & Grazing",
            Description = "Feed and supplemental lick costs",
            Quantity = totalAnimalUnits,
            UnitPrice = feedCostPerAU,
            Amount = feedCost,
            Type = "expense"
        });

        var workerCount = GetDecimalParam(paramDict, "worker_count", 2m);
        var labourCostPerWorker = GetDecimalParam(paramDict, "labour_cost_per_worker_annual", 72000m);
        var labourCost = workerCount * labourCostPerWorker;

        lineItems.Add(new ForecastLineItem
        {
            Id = Guid.NewGuid(),
            Category = "Labour",
            Description = "Annual farm labour costs",
            Quantity = workerCount,
            UnitPrice = labourCostPerWorker,
            Amount = labourCost,
            Type = "expense"
        });

        var vetCostPerAU = GetDecimalParam(paramDict, "vet_cost_per_animal_unit", 150m);
        var vetCost = totalAnimalUnits * vetCostPerAU;

        lineItems.Add(new ForecastLineItem
        {
            Id = Guid.NewGuid(),
            Category = "Veterinary",
            Description = "Veterinary and health costs",
            Quantity = totalAnimalUnits,
            UnitPrice = vetCostPerAU,
            Amount = vetCost,
            Type = "expense"
        });

        // ── Totals ────────────────────────────────────────────────────────

        var totalIncome = lineItems.Where(l => l.Type == "income").Sum(l => l.Amount);
        var totalExpenses = lineItems.Where(l => l.Type == "expense").Sum(l => l.Amount);

        var forecastYear = new ForecastYear
        {
            Id = Guid.NewGuid(),
            Year = year,
            TotalIncome = totalIncome,
            TotalExpenses = totalExpenses,
            NetProfit = totalIncome - totalExpenses,
            LineItems = lineItems
        };

        return (forecastYear, nextHerd);
    }

    /// <summary>
    /// Calculates total animal units (AU) from herd state.
    /// Standard AU conversions: cow=1.0, bull=1.5, tolly=0.5, heifer=0.75
    ///                          ewe=0.15, ram=0.2, lamb=0.08
    /// </summary>
    private static decimal CalculateTotalAnimalUnits(Dictionary<string, int> herd)
    {
        var auFactors = new Dictionary<string, decimal>
        {
            ["cattle_cow"]    = 1.0m,
            ["cattle_bull"]   = 1.5m,
            ["cattle_tolly"]  = 0.5m,
            ["cattle_heifer"] = 0.75m,
            ["sheep_ewe"]     = 0.15m,
            ["sheep_ram"]     = 0.20m,
            ["sheep_lamb"]    = 0.08m,
            ["sheep_hogget"]  = 0.12m
        };

        return herd.Sum(kvp =>
            kvp.Value * auFactors.GetValueOrDefault(kvp.Key, 0.1m));
    }

    private static decimal GetDecimalParam(Dictionary<string, string> paramDict, string key, decimal defaultValue)
    {
        if (paramDict.TryGetValue(key, out var raw) && decimal.TryParse(raw, out var val))
            return val;
        return defaultValue;
    }

    private async Task AssertOwnershipAsync(Guid farmId, Guid userId)
    {
        if (!await farmRepository.BelongsToUserAsync(farmId, userId))
            throw new UnauthorizedAccessException("Farm does not belong to the current user.");
    }
}
