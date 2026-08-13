namespace BoerIT.Server.DTOs;

public record RegisterRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName);

public record LoginRequest(
    string Email,
    string Password);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    Guid UserId,
    string Email,
    string FirstName,
    string LastName);
