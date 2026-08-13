using BoerIT.Core.Models;

namespace BoerIT.Core.Interfaces;

public interface IParameterRepository
{
    Task<IEnumerable<FarmParameter>> GetByFarmIdAsync(Guid farmId);
    Task<FarmParameter?> GetByKeyAsync(Guid farmId, string key);
    Task UpsertAsync(Guid farmId, IEnumerable<FarmParameter> parameters);
    Task<bool> DeleteByKeyAsync(Guid farmId, string key);

    Task<IEnumerable<LivestockGroup>> GetLivestockGroupsAsync(Guid farmId);
    Task<LivestockGroup?> GetLivestockGroupByIdAsync(Guid id);
    Task<LivestockGroup> UpsertLivestockGroupAsync(LivestockGroup group);
    Task<bool> DeleteLivestockGroupAsync(Guid id);
}
