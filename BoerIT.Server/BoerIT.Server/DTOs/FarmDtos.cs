namespace BoerIT.Server.DTOs;

public record CreateFarmRequest(
    string Name,
    string? Description,
    string? Location,
    decimal LandHectares);

public record UpdateFarmRequest(
    string Name,
    string? Description,
    string? Location,
    decimal LandHectares);

public record FarmResponse(
    Guid Id,
    Guid UserId,
    string Name,
    string? Description,
    string? Location,
    decimal LandHectares,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
