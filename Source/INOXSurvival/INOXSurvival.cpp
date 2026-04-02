#include "INOXSurvival.h"

#define LOCTEXT_NAMESPACE "FINOXSurvivalModule"

void FINOXSurvivalModule::StartupModule()
{
	UE_LOG(LogTemp, Log, TEXT("INOXSurvival Module Started"));
}

void FINOXSurvivalModule::ShutdownModule()
{
	UE_LOG(LogTemp, Log, TEXT("INOXSurvival Module Shut Down"));
}

#undef LOCTEXT_NAMESPACE

IMPLEMENT_PRIMARY_GAME_MODULE(FINOXSurvivalModule, INOXSurvival, "INOXSurvival");
