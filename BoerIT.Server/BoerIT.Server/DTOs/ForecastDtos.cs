namespace BoerIT.Server.DTOs;

public record GenerateForecastRequest(int ForecastYears);

public record ForecastSummaryResponse(
    Guid Id,
    Guid FarmId,
    DateTime GeneratedAt,
    int BaseYear,
    int ForecastYears,
    string Status);

public record ForecastResponse(
    Guid Id,
    Guid FarmId,
    DateTime GeneratedAt,
    int BaseYear,
    int ForecastYears,
    string Status,
    List<ForecastYearResponse> Years);

public record ForecastYearResponse(
    Guid Id,
    int Year,
    decimal TotalIncome,
    decimal TotalExpenses,
    decimal NetProfit,
    List<ForecastLineItemResponse> LineItems);

public record ForecastLineItemResponse(
    Guid Id,
    string Category,
    string Description,
    decimal Quantity,
    decimal UnitPrice,
    decimal Amount,
    string Type);
