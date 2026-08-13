using BoerIT.Core.Models;

namespace BoerIT.Service.Interfaces;

public interface IForecastService
{
    Task<IEnumerable<Forecast>> GetForecastsAsync(Guid farmId, Guid userId);
    Task<Forecast?> GetForecastAsync(Guid forecastId, Guid farmId, Guid userId);
    Task<Forecast> GenerateForecastAsync(Guid farmId, Guid userId, int forecastYears);
    Task<bool> DeleteForecastAsync(Guid forecastId, Guid farmId, Guid userId);
}
