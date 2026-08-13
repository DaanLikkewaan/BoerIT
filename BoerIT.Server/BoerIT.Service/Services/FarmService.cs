using BoerIT.Core.Interfaces;
using BoerIT.Core.Models;
using BoerIT.Service.Interfaces;

namespace BoerIT.Service.Services;

public class FarmService(IFarmRepository farmRepository) : IFarmService
{
    public async Task<IEnumerable<Farm>> GetUserFarmsAsync(Guid userId) =>
        await farmRepository.GetByUserIdAsync(userId);

    public async Task<Farm?> GetFarmAsync(Guid farmId, Guid userId)
    {
        if (!await farmRepository.BelongsToUserAsync(farmId, userId))
            return null;

        return await farmRepository.GetByIdAsync(farmId);
    }

    public async Task<Farm> CreateFarmAsync(
        Guid userId, string name, string? description, string? location, decimal landHectares)
    {
        var farm = new Farm
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = name.Trim(),
            Description = description?.Trim(),
            Location = location?.Trim(),
            LandHectares = landHectares,
            CreatedAt = DateTime.UtcNow
        };

        return await farmRepository.CreateAsync(farm);
    }

    public async Task<Farm> UpdateFarmAsync(
        Guid farmId, Guid userId, string name, string? description, string? location, decimal landHectares)
    {
        if (!await farmRepository.BelongsToUserAsync(farmId, userId))
            throw new UnauthorizedAccessException("Farm does not belong to the current user.");

        var farm = await farmRepository.GetByIdAsync(farmId)
            ?? throw new KeyNotFoundException($"Farm {farmId} not found.");

        farm.Name = name.Trim();
        farm.Description = description?.Trim();
        farm.Location = location?.Trim();
        farm.LandHectares = landHectares;

        return await farmRepository.UpdateAsync(farm);
    }

    public async Task<bool> DeleteFarmAsync(Guid farmId, Guid userId)
    {
        if (!await farmRepository.BelongsToUserAsync(farmId, userId))
            throw new UnauthorizedAccessException("Farm does not belong to the current user.");

        return await farmRepository.DeleteAsync(farmId);
    }
}
