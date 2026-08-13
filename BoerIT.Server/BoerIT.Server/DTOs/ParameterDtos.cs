namespace BoerIT.Server.DTOs;

public record FarmParameterDto(
    string ParameterKey,
    string ParameterValue,
    string? Unit,
    string? Category);

public record UpsertParametersRequest(List<FarmParameterDto> Parameters);

public record LivestockGroupRequest(
    string Species,
    string Category,
    int CurrentCount,
    int? TargetCount,
    decimal? AverageAgeMonths,
    decimal? AverageWeightKg);

public record LivestockGroupResponse(
    Guid Id,
    Guid FarmId,
    string Species,
    string Category,
    int CurrentCount,
    int? TargetCount,
    decimal? AverageAgeMonths,
    decimal? AverageWeightKg,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
