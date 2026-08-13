namespace BoerIT.Core.Models;

public class Forecast
{
    public Guid Id { get; set; }
    public Guid FarmId { get; set; }
    public DateTime GeneratedAt { get; set; }
    public int BaseYear { get; set; }
    public int ForecastYears { get; set; }
    public string Status { get; set; } = string.Empty; // pending | completed | failed
    public List<ForecastYear> Years { get; set; } = [];
}

public class ForecastYear
{
    public Guid Id { get; set; }
    public Guid ForecastId { get; set; }
    public int Year { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetProfit { get; set; }
    public List<ForecastLineItem> LineItems { get; set; } = [];
}

public class ForecastLineItem
{
    public Guid Id { get; set; }
    public Guid ForecastYearId { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty; // income | expense
}
