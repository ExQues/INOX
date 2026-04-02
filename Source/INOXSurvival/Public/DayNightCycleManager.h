#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "DayNightCycleManager.generated.h"

UENUM(BlueprintType)
enum class EWeatherType : uint8
{
	Clear,
	Cloudy,
	Rain,
	Storm,
	Fog
};

UCLASS()
class INOXSURVIVAL_API ADayNightCycleManager : public AActor
{
	GENERATED_BODY()

public:
	ADayNightCycleManager();

protected:
	virtual void BeginPlay() override;

public:
	virtual void Tick(float DeltaTime) override;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Time")
	float DayLengthInMinutes = 24.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Time")
	float CurrentGameTime = 6.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Time")
	float TimeScale = 1.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Sun")
	class ADirectionalLight* SunLight;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Sun")
	class ADirectionalLight* MoonLight;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Sky")
	class ASkyAtmosphere* SkyAtmosphere;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Sky")
	class ASkySphere* SkySphere;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Light")
	class UDirectionalLightComponent* SunLightComponent;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Light")
	class UDirectionalLightComponent* MoonLightComponent;

	UFUNCTION(BlueprintCallable, Category = "Time")
	void SetTime(float NewTime);

	UFUNCTION(BlueprintCallable, Category = "Time")
	float GetTimeOfDay() const { return CurrentGameTime; }

	UFUNCTION(BlueprintCallable, Category = "Time")
	int32 GetDayNumber() const { return DayNumber; }

	UFUNCTION(BlueprintCallable, Category = "Time")
	bool IsDaytime() const;

	UFUNCTION(BlueprintCallable, Category = "Time")
	bool IsNighttime() const;

	UFUNCTION(BlueprintCallable, Category = "Time")
	FString GetTimeString() const;

	UFUNCTION(BlueprintCallable, Category = "Weather")
	void SetWeather(EWeatherType NewWeather);

	UFUNCTION(BlueprintCallable, Category = "Weather")
	EWeatherType GetCurrentWeather() const { return CurrentWeather; }

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weather")
	float WeatherChangeInterval = 300.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weather")
	TArray<EWeatherType> PossibleWeatherTypes;

	UPROPERTY(BlueprintAssignable, Category = "Events")
	FOnDaytimeChanged OnDaytimeChanged;

	UPROPERTY(BlueprintAssignable, Category = "Events")
	FOnWeatherChanged OnWeatherChanged;

protected:
	void UpdateSunPosition();
	void UpdateLighting();
	void UpdateAmbientSounds();
	void UpdateWeatherEffects(float DeltaTime);
	void ApplyWeatherImpacts();

	float TimeSinceLastWeatherChange = 0.0f;
	int32 DayNumber = 1;
	bool bWasDaytime = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weather")
	EWeatherType CurrentWeather = EWeatherType::Clear;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weather")
	float CloudDensity = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weather")
	float RainIntensity = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weather")
	float FogDensity = 0.0f;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnDaytimeChanged);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnWeatherChanged, EWeatherType, NewWeather);
