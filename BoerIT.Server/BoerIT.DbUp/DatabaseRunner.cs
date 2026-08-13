using System.Reflection;
using DbUp;

namespace BoerIT.DbUp;

/// <summary>
/// Applies the embedded SQL migration scripts to the target PostgreSQL database.
/// Scripts live under <c>Scripts/</c> as embedded resources and run once each,
/// in alphabetical order, tracked in DbUp's <c>schemaversions</c> journal table.
/// </summary>
public static class DatabaseRunner
{
    public static void RunMigrations(string connectionString)
    {
        // Create the database if it does not yet exist.
        EnsureDatabase.For.PostgresqlDatabase(connectionString);

        var upgrader = DeployChanges.To
            .PostgresqlDatabase(connectionString)
            .WithScriptsEmbeddedInAssembly(Assembly.GetExecutingAssembly())
            .LogToConsole()
            .Build();

        var result = upgrader.PerformUpgrade();

        if (!result.Successful)
        {
            throw new InvalidOperationException("Database migration failed.", result.Error);
        }
    }
}
