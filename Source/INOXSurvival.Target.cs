using UnrealBuildTool;
using System.Collections.Generic;

public class INOXSurvivalTarget : TargetRules
{
	public INOXSurvivalTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.V2;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_1;
		ExtraModuleNames.AddRange(new string[] { "INOXSurvival" });
	}
}
