using BoerIT.Core.Models;

namespace BoerIT.Service.Interfaces;

public interface IFarmService
{
    Task<IEnumerable<Farm>> GetUserFarmsAsync(Guid userId);
    Task<Farm?> GetFarmAsync(Guid farmId, Guid userId);
    Task<Farm> CreateFarmAsync(Guid userId, string name, string? description, string? location, decimal landHectares);
    Task<Farm> UpdateFarmAsync(Guid farmId, Guid userId, string name, string? description, string? location, decimal landHectares);
    Task<bool> DeleteFarmAsync(Guid farmId, Guid userId);
}
