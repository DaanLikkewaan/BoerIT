using BoerIT.Core.Models;

namespace BoerIT.Core.Interfaces;

public interface IFarmRepository
{
    Task<Farm?> GetByIdAsync(Guid id);
    Task<IEnumerable<Farm>> GetByUserIdAsync(Guid userId);
    Task<Farm> CreateAsync(Farm farm);
    Task<Farm> UpdateAsync(Farm farm);
    Task<bool> DeleteAsync(Guid id);
    Task<bool> BelongsToUserAsync(Guid farmId, Guid userId);
}
