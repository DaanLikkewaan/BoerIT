using BoerIT.Core.Models;

namespace BoerIT.Core.Interfaces;

public interface IForecastRepository
{
    Task<Forecast?> GetByIdAsync(Guid id);
    Task<IEnumerable<Forecast>> GetByFarmIdAsync(Guid farmId);
    Task<Forecast> CreateAsync(Forecast forecast);
    Task<Forecast> UpdateStatusAsync(Guid id, string status);
    Task<bool> DeleteAsync(Guid id);
}
