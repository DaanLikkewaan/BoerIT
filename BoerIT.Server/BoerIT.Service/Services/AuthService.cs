using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BoerIT.Core.Interfaces;
using BoerIT.Core.Models;
using BoerIT.Service.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BoerIT.Service.Services;

public class AuthService(IUserRepository userRepository, IConfiguration configuration) : IAuthService
{
    private readonly string _jwtSecret = configuration["Jwt:Secret"]
        ?? throw new InvalidOperationException("JWT secret is not configured.");
    private readonly string _jwtIssuer = configuration["Jwt:Issuer"] ?? "BoerIT";
    private readonly string _jwtAudience = configuration["Jwt:Audience"] ?? "BoerIT";
    private readonly int _jwtExpiryMinutes = int.Parse(configuration["Jwt:ExpiryMinutes"] ?? "60");

    public async Task<AuthResult> RegisterAsync(string email, string password, string firstName, string lastName)
    {
        if (await userRepository.ExistsAsync(email))
            return AuthResult.Fail("An account with this email already exists.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email.ToLower().Trim(),
            PasswordHash = HashPassword(password),
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var created = await userRepository.CreateAsync(user);
        return BuildAuthResult(created);
    }

    public async Task<AuthResult> LoginAsync(string email, string password)
    {
        var user = await userRepository.GetByEmailAsync(email.ToLower().Trim());

        if (user is null || !VerifyPassword(password, user.PasswordHash))
            return AuthResult.Fail("Invalid email or password.");

        return BuildAuthResult(user);
    }

    public Task<AuthResult> RefreshTokenAsync(string refreshToken)
    {
        // Refresh token validation will be implemented in Phase 2
        // For now, clients should re-authenticate on token expiry
        throw new NotImplementedException("Refresh token flow not yet implemented.");
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private AuthResult BuildAuthResult(User user)
    {
        var (token, expiresAt) = GenerateJwt(user);
        return new AuthResult
        {
            Success = true,
            AccessToken = token,
            RefreshToken = GenerateRefreshToken(),
            ExpiresAt = expiresAt,
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName
        };
    }

    private (string token, DateTime expiresAt) GenerateJwt(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwtExpiryMinutes);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.GivenName, user.FirstName),
            new Claim(JwtRegisteredClaimNames.FamilyName, user.LastName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _jwtIssuer,
            audience: _jwtAudience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    private static string HashPassword(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

    private static bool VerifyPassword(string password, string hash) =>
        BCrypt.Net.BCrypt.Verify(password, hash);
}
