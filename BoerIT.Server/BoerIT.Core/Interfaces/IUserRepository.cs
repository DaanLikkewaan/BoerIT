using BoerIT.Core.Models;

namespace BoerIT.Core.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByEmailAsync(string email);
    Task<User> CreateAsync(User user);
    Task<User> UpdateAsync(User user);
    Task UpdatePasswordHashAsync(Guid id, string passwordHash);
    Task<bool> ExistsAsync(string email);
}
