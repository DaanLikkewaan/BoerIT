using BoerIT.Core.Interfaces;
using BoerIT.Core.Models;
using BoerIT.Service.Interfaces;

namespace BoerIT.Service.Services;

public class ParameterService(
    IFarmRepository farmRepository,
    IParameterRepository parameterRepository) : IParameterService
{
    public async Task<IEnumerable<FarmParameter>> GetParametersAsync(Guid farmId, Guid userId)
    {
        await AssertOwnershipAsync(farmId, userId);
        return await parameterRepository.GetByFarmIdAsync(farmId);
    }

    public async Task UpsertParametersAsync(Guid farmId, Guid userId, IEnumerable<FarmParameter> parameters)
    {
        await AssertOwnershipAsync(farmId, userId);
        await parameterRepository.UpsertAsync(farmId, parameters);
    }

    public async Task<bool> DeleteParameterAsync(Guid farmId, Guid userId, string key)
    {
        await AssertOwnershipAsync(farmId, userId);
        return await parameterRepository.DeleteByKeyAsync(farmId, key);
    }

    public async Task<IEnumerable<LivestockGroup>> GetLivestockGroupsAsync(Guid farmId, Guid userId)
    {
        await AssertOwnershipAsync(farmId, userId);
        return await parameterRepository.GetLivestockGroupsAsync(farmId);
    }

    public async Task<LivestockGroup> UpsertLivestockGroupAsync(Guid farmId, Guid userId, LivestockGroup group)
    {
        await AssertOwnershipAsync(farmId, userId);
        group.FarmId = farmId;
        return await parameterRepository.UpsertLivestockGroupAsync(group);
    }

    public async Task<bool> DeleteLivestockGroupAsync(Guid farmId, Guid userId, Guid groupId)
    {
        await AssertOwnershipAsync(farmId, userId);
        var group = await parameterRepository.GetLivestockGroupByIdAsync(groupId);

        if (group is null || group.FarmId != farmId)
            throw new KeyNotFoundException("Livestock group not found.");

        return await parameterRepository.DeleteLivestockGroupAsync(groupId);
    }

    private async Task AssertOwnershipAsync(Guid farmId, Guid userId)
    {
        if (!await farmRepository.BelongsToUserAsync(farmId, userId))
            throw new UnauthorizedAccessException("Farm does not belong to the current user.");
    }
}
