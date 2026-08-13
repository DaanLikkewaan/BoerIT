namespace BoerIT.Core.Models;

public class LivestockGroup
{
    public Guid Id { get; set; }
    public Guid FarmId { get; set; }
    public string Species { get; set; } = string.Empty;   // cattle | sheep
    public string Category { get; set; } = string.Empty;  // cow | bull | tolly | heifer | ewe | ram | lamb | hogget
    public int CurrentCount { get; set; }
    public int? TargetCount { get; set; }
    public decimal? AverageAgemonths { get; set; }
    public decimal? AverageWeightKg { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
