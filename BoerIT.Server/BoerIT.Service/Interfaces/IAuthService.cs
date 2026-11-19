using BoerIT.Core.Models;

namespace BoerIT.Service.Interfaces;

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(string email, string password, string firstName, string lastName);
    Task<AuthResult> LoginAsync(string email, string password);
    Task<AuthResult> RefreshTokenAsync(string refreshToken);

    /// <summary>
    /// Creates the account if it does not exist, or resets its password if it
    /// no longer matches. Used to provision the demo users at startup.
    /// Returns true when anything was changed.
    /// </summary>
    Task<bool> EnsureUserAsync(string email, string password, string firstName, string lastName);
}
