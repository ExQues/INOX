#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleManager.h"

class FINOXSurvivalModule : public FDefaultGameModuleImpl
{
public:
	virtual void StartupModule() override;
	virtual void ShutdownModule() override;
};
