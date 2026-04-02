#include "DayNightCycleManager.h"
#include "Components/DirectionalLightComponent.h"
#include "Engine/DirectionalLight.h"
#include "Engine/SkyAtmosphere.h"
#include "Engine/SkySphere.h"
#include "Kismet/GameplayStatics.h"

ADayNightCycleManager::ADayNightCycleManager()
{
	PrimaryActorTick.bCanEverTick = true;

	DayLengthInMinutes = 24.0f;
	CurrentGameTime = 6.0f;
	TimeScale = 1.0f;

	CurrentWeather = EWeatherType::Clear;
	WeatherChangeInterval = 300.0f;
	TimeSinceLastWeatherChange = 0.0f;

	CloudDensity = 0.0f;
	RainIntensity = 0.0f;
	FogDensity = 0.0f;

	PossibleWeatherTypes = { EWeatherType::Clear, EWeatherType::Cloudy, EWeatherType::Rain, EWeatherType::Fog };
}

void ADayNightCycleManager::BeginPlay()
{
	Super::BeginPlay();

	SunLight = Cast<ADirectionalLight>(UGameplayStatics::GetActorOfClass(this, ADirectionalLight::StaticClass()));
	if (!SunLight)
	{
		SunLight = GetWorld()->SpawnActor<ADirectionalLight>(ADirectionalLight::StaticClass(), FVector::ZeroVector, FRotator(0, -45, 0));
	}

	if (SunLight)
	{
		SunLightComponent = SunLight->GetLightComponent();
	}

	MoonLight = GetWorld()->SpawnActor<ADirectionalLight>(ADirectionalLight::StaticClass(), FVector::ZeroVector, FRotator(0, 135, 0));
	if (MoonLight)
	{
		MoonLightComponent = MoonLight->GetLightComponent();
		MoonLightComponent->SetIntensity(0.0f);
	}

	SkyAtmosphere = Cast<ASkyAtmosphere>(UGameplayStatics::GetActorOfClass(this, ASkyAtmosphere::StaticClass()));

	bWasDaytime = IsDaytime();
	UpdateSunPosition();
}

void ADayNightCycleManager::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	float TimeIncrement = (DeltaTime / (DayLengthInMinutes * 60.0f)) * 24.0f * TimeScale;
	CurrentGameTime += TimeIncrement;

	if (CurrentGameTime >= 24.0f)
	{
		CurrentGameTime -= 24.0f;
		DayNumber++;
	}

	UpdateSunPosition();
	UpdateLighting();
	UpdateWeatherEffects(DeltaTime);

	bool bCurrentDaytime = IsDaytime();
	if (bCurrentDaytime != bWasDaytime)
	{
		bWasDaytime = bCurrentDaytime;
		OnDaytimeChanged.Broadcast();
	}
}

void ADayNightCycleManager::UpdateSunPosition()
{
	if (!SunLight || !MoonLight)
	{
		return;
	}

	float SunAngle = (CurrentGameTime / 24.0f) * 360.0f - 90.0f;
	float SunRad = FMath::DegreesToRadians(SunAngle);

	FRotator SunRotation = FRotator(-SunAngle, 180.0f, 0.0f);
	SunLight->SetActorRotation(SunRotation);

	FRotator MoonRotation = FRotator(-SunAngle - 180.0f, 180.0f, 0.0f);
	MoonLight->SetActorRotation(MoonRotation);

	float SunHeight = FMath::Sin(SunRad);
	float SunIntensity = FMath::Max(0.0f, SunHeight * 10.0f);
	float MoonIntensity = FMath::Max(0.0f, -SunHeight * 2.0f);

	if (SunLightComponent)
	{
		SunLightComponent->SetIntensity(SunIntensity * 100000.0f);
	}

	if (MoonLightComponent)
	{
		MoonLightComponent->SetIntensity(MoonIntensity * 50000.0f);
	}

	if (SkyAtmosphere)
	{
		SkyAtmosphere->SetActorRotation(SunRotation);
	}
}

void ADayNightCycleManager::UpdateLighting()
{
	float SunHeight = FMath::Sin(FMath::DegreesToRadians((CurrentGameTime / 24.0f) * 360.0f - 90.0f));
	float SkyBrightness = FMath::Max(0.1f, SunHeight * 0.8f + 0.2f);

	if (SunLightComponent)
	{
		float LightColorTemperature = FMath::Lerp(6500.0f, 3500.0f, FMath::Abs(SunHeight));
		FLinearColor SunColor = FLinearColor::FromTemperature(LightColorTemperature);
		SunLightComponent->SetLightColor(SunColor);
	}

	UpdateAmbientSounds();
}

void ADayNightCycleManager::UpdateAmbientSounds()
{
}

void ADayNightCycleManager::UpdateWeatherEffects(float DeltaTime)
{
	TimeSinceLastWeatherChange += DeltaTime;

	if (TimeSinceLastWeatherChange >= WeatherChangeInterval)
	{
		TimeSinceLastWeatherChange = 0.0f;

		if (PossibleWeatherTypes.Num() > 0)
		{
			int32 RandomIndex = FMath::RandRange(0, PossibleWeatherTypes.Num() - 1);
			SetWeather(PossibleWeatherTypes[RandomIndex]);
		}
	}

	ApplyWeatherImpacts();
}

void ADayNightCycleManager::SetTime(float NewTime)
{
	CurrentGameTime = FMath::Clamp(NewTime, 0.0f, 24.0f);
	UpdateSunPosition();
	UpdateLighting();
}

bool ADayNightCycleManager::IsDaytime() const
{
	return CurrentGameTime >= 6.0f && CurrentGameTime < 18.0f;
}

bool ADayNightCycleManager::IsNighttime() const
{
	return CurrentGameTime < 6.0f || CurrentGameTime >= 18.0f;
}

FString ADayNightCycleManager::GetTimeString() const
{
	int32 Hours = FMath::FloorToInt(CurrentGameTime);
	int32 Minutes = FMath::FloorToInt((CurrentGameTime - Hours) * 60.0f);

	return FString::Printf(TEXT("%02d:%02d"), Hours, Minutes);
}

void ADayNightCycleManager::SetWeather(EWeatherType NewWeather)
{
	if (CurrentWeather != NewWeather)
	{
		CurrentWeather = NewWeather;
		OnWeatherChanged.Broadcast(NewWeather);

		switch (CurrentWeather)
		{
		case EWeatherType::Clear:
			CloudDensity = 0.0f;
			RainIntensity = 0.0f;
			FogDensity = 0.0f;
			break;

		case EWeatherType::Cloudy:
			CloudDensity = 0.5f;
			RainIntensity = 0.0f;
			FogDensity = 0.1f;
			break;

		case EWeatherType::Rain:
			CloudDensity = 0.8f;
			RainIntensity = 0.5f;
			FogDensity = 0.2f;
			break;

		case EWeatherType::Storm:
			CloudDensity = 1.0f;
			RainIntensity = 1.0f;
			FogDensity = 0.3f;
			break;

		case EWeatherType::Fog:
			CloudDensity = 0.3f;
			RainIntensity = 0.0f;
			FogDensity = 0.8f;
			break;
		}
	}
}

void ADayNightCycleManager::ApplyWeatherImpacts()
{
}
