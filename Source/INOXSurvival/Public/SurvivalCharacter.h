#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "EnhancedInputComponent.h"
#include "InputActionValue.h"
#include "SurvivalCharacter.generated.h"

UENUM(BlueprintType)
enum class EItemType : uint8
{
	Resource,
	Tool,
	Weapon,
	Armor,
	Consumable,
	Material,
	QuestItem
};

USTRUCT(BlueprintType)
struct FItemData
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString ItemName;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FString Description;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	EItemType ItemType;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 MaxStackSize = 1;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	float Weight = 1.0f;
};

USTRUCT(BlueprintType)
struct FInventorySlot
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	FItemData ItemData;

	UPROPERTY(EditAnywhere, BlueprintReadWrite)
	int32 Quantity = 0;
};

UCLASS()
class INOXSURVIVAL_API ASurvivalCharacter : public ACharacter
{
	GENERATED_BODY()

public:
	ASurvivalCharacter();

protected:
	virtual void BeginPlay() override;

public:
	virtual void Tick(float DeltaTime) override;
	virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Camera")
	class USpringArmComponent* CameraBoom;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Camera")
	class UCameraComponent* FollowCamera;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Input")
	class UInputAction* MoveAction;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Input")
	class UInputAction* LookAction;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Input")
	class UInputAction* JumpAction;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Input")
	class UInputAction* SprintAction;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Input")
	class UInputAction* InteractAction;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Input")
	class UInputAction* ToggleInventoryAction;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Input")
	class UInputAction* ToggleCraftingAction;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Input")
	class UInputAction* PauseAction;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Input")
	class UInputAction* CrouchAction;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Input")
	class UInputAction* AttackAction;

	void Move(const FInputActionValue& Value);
	void Look(const FInputActionValue& Value);
	void StartJump();
	void StopJump();
	void StartSprint();
	void StopSprint();
	void Interact();
	void ToggleInventory();
	void ToggleCrafting();
	void PauseGame();
	void StartCrouch();
	void StopCrouch();
	void Attack();

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Survival")
	float Health = 100.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Survival")
	float Hunger = 100.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Survival")
	float Thirst = 100.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Survival")
	float Energy = 100.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Survival")
	float Temperature = 37.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Survival")
	float MaxHealth = 100.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Survival")
	float MaxHunger = 100.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Survival")
	float MaxThirst = 100.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Survival")
	float MaxEnergy = 100.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Survival")
	float HungerDecayRate = 0.5f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Survival")
	float ThirstDecayRate = 0.7f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Survival")
	float EnergyDecayRate = 0.3f;

	UFUNCTION(BlueprintCallable, Category = "Survival")
	void UpdateSurvivalStats(float DeltaTime);

	UFUNCTION(BlueprintCallable, Category = "Survival")
	void TakeDamage(float DamageAmount);

	UFUNCTION(BlueprintCallable, Category = "Survival")
	void Heal(float HealAmount);

	UFUNCTION(BlueprintCallable, Category = "Survival")
	void Feed(float FoodAmount);

	UFUNCTION(BlueprintCallable, Category = "Survival")
	void Drink(float WaterAmount);

	UFUNCTION(BlueprintCallable, Category = "Survival")
	void Rest(float EnergyAmount);

	UFUNCTION(BlueprintCallable, Category = "Survival")
	float GetHealthPercentage() const;

	UFUNCTION(BlueprintCallable, Category = "Survival")
	float GetHungerPercentage() const;

	UFUNCTION(BlueprintCallable, Category = "Survival")
	float GetThirstPercentage() const;

	UFUNCTION(BlueprintCallable, Category = "Survival")
	float GetEnergyPercentage() const;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Inventory")
	TArray<FInventorySlot> InventorySlots;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Inventory")
	int32 MaxInventorySize = 32;

	UFUNCTION(BlueprintCallable, Category = "Inventory")
	bool AddItem(const FItemData& ItemData, int32 Quantity = 1);

	UFUNCTION(BlueprintCallable, Category = "Inventory")
	bool RemoveItem(const FString& ItemName, int32 Quantity = 1);

	UFUNCTION(BlueprintCallable, Category = "Inventory")
	int32 GetItemCount(const FString& ItemName) const;

	UFUNCTION(BlueprintCallable, Category = "Inventory")
	bool HasItem(const FString& ItemName, int32 Quantity = 1) const;

protected:
	bool bIsSprinting = false;
	bool bIsCrouching = false;
	float SprintSpeedMultiplier = 1.5f;
	float CrouchSpeedMultiplier = 0.5f;
	float BaseWalkSpeed = 400.0f;

	bool FindEmptySlot(int32& OutIndex);
	bool FindExistingSlot(const FString& ItemName, int32& OutIndex);

private:
	void UpdateMovementSpeed();
};
