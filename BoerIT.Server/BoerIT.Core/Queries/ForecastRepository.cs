using BoerIT.Core.Interfaces;
using BoerIT.Core.Models;
using Dapper;
using Npgsql;

namespace BoerIT.Core.Queries;

public class ForecastRepository(string connectionString) : IForecastRepository
{
    private NpgsqlConnection CreateConnection() => new(connectionString);

    public async Task<Forecast?> GetByIdAsync(Guid id)
    {
        using var conn = CreateConnection();

        var forecast = await conn.QuerySingleOrDefaultAsync<Forecast>(
            "SELECT * FROM forecasts WHERE id = @Id", new { Id = id });

        if (forecast is null) return null;

        forecast.Years = (await GetYearsAsync(conn, id)).ToList();
        return forecast;
    }

    public async Task<IEnumerable<Forecast>> GetByFarmIdAsync(Guid farmId)
    {
        using var conn = CreateConnection();
        return await conn.QueryAsync<Forecast>(
            "SELECT * FROM forecasts WHERE farm_id = @FarmId ORDER BY generated_at DESC",
            new { FarmId = farmId });
    }

    public async Task<Forecast> CreateAsync(Forecast forecast)
    {
        using var conn = CreateConnection();
        await conn.OpenAsync();
        using var tx = await conn.BeginTransactionAsync();

        const string forecastSql = """
            INSERT INTO forecasts (id, farm_id, generated_at, base_year, forecast_years, status)
            VALUES (@Id, @FarmId, @GeneratedAt, @BaseYear, @ForecastYears, @Status)
            RETURNING *;
            """;

        var created = await conn.QuerySingleAsync<Forecast>(forecastSql, forecast, tx);

        foreach (var year in forecast.Years)
        {
            year.ForecastId = created.Id;
            await InsertYearAsync(conn, tx, year);
        }

        await tx.CommitAsync();
        created.Years = forecast.Years;
        return created;
    }

    public async Task<Forecast> UpdateStatusAsync(Guid id, string status)
    {
        using var conn = CreateConnection();
        return await conn.QuerySingleAsync<Forecast>(
            "UPDATE forecasts SET status = @Status WHERE id = @Id RETURNING *;",
            new { Id = id, Status = status });
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        using var conn = CreateConnection();
        var rows = await conn.ExecuteAsync("DELETE FROM forecasts WHERE id = @Id", new { Id = id });
        return rows > 0;
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private static async Task<IEnumerable<ForecastYear>> GetYearsAsync(NpgsqlConnection conn, Guid forecastId)
    {
        var years = (await conn.QueryAsync<ForecastYear>(
            "SELECT * FROM forecast_years WHERE forecast_id = @ForecastId ORDER BY year",
            new { ForecastId = forecastId })).ToList();

        foreach (var year in years)
        {
            year.LineItems = (await conn.QueryAsync<ForecastLineItem>(
                "SELECT * FROM forecast_line_items WHERE forecast_year_id = @YearId ORDER BY type, category",
                new { YearId = year.Id })).ToList();
        }

        return years;
    }

    private static async Task InsertYearAsync(NpgsqlConnection conn, NpgsqlTransaction tx, ForecastYear year)
    {
        if (year.Id == Guid.Empty) year.Id = Guid.NewGuid();

        const string yearSql = """
            INSERT INTO forecast_years (id, forecast_id, year, total_income, total_expenses, net_profit)
            VALUES (@Id, @ForecastId, @Year, @TotalIncome, @TotalExpenses, @NetProfit);
            """;
        await conn.ExecuteAsync(yearSql, year, tx);

        const string itemSql = """
            INSERT INTO forecast_line_items
                (id, forecast_year_id, category, description, quantity, unit_price, amount, type)
            VALUES
                (@Id, @ForecastYearId, @Category, @Description, @Quantity, @UnitPrice, @Amount, @Type);
            """;

        foreach (var item in year.LineItems)
        {
            if (item.Id == Guid.Empty) item.Id = Guid.NewGuid();
            item.ForecastYearId = year.Id;
            await conn.ExecuteAsync(itemSql, item, tx);
        }
    }
}
