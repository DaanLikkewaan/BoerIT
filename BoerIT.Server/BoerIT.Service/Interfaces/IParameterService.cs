using BoerIT.Core.Models;

namespace BoerIT.Service.Interfaces;

public interface IParameterService
{
    Task<IEnumerable<FarmParameter>> GetParametersAsync(Guid farmId, Guid userId);
    Task UpsertParametersAsync(Guid farmId, Guid userId, IEnumerable<FarmParameter> parameters);
    Task<bool> DeleteParameterAsync(Guid farmId, Guid userId, string key);

    Task<IEnumerable<LivestockGroup>> GetLivestockGroupsAsync(Guid farmId, Guid userId);
    Task<LivestockGroup> UpsertLivestockGroupAsync(Guid farmId, Guid userId, LivestockGroup group);
    Task<bool> DeleteLivestockGroupAsync(Guid farmId, Guid userId, Guid groupId);
}
