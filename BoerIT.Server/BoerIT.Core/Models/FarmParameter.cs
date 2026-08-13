namespace BoerIT.Core.Models;

public class FarmParameter
{
    public Guid Id { get; set; }
    public Guid FarmId { get; set; }
    public string ParameterKey { get; set; } = string.Empty;
    public string ParameterValue { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public string? Category { get; set; }
    public DateTime UpdatedAt { get; set; }
}
