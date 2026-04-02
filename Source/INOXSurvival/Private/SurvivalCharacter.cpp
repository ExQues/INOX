#include "SurvivalCharacter.h"
#include "Camera/CameraComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"
#include "Components/CapsuleComponent.h"

ASurvivalCharacter::ASurvivalCharacter()
{
	PrimaryActorTick.bCanEverTick = true;

	CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
	CameraBoom->SetupAttachment(RootComponent);
	CameraBoom->TargetArmLength = 300.0f;
	CameraBoom->bUsePawnControlRotation = true;

	FollowCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FollowCamera"));
	FollowCamera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);
	FollowCamera->bUsePawnControlRotation = false;

	bUseControllerRotationPitch = false;
	bUseControllerRotationYaw = false;
	bUseControllerRotationRoll = false;

	GetCharacterMovement()->bOrientRotationToMovement = true;
	GetCharacterMovement()->RotationRate = FRotator(0.0f, 540.0f, 0.0f);
	GetCharacterMovement()->JumpZVelocity = 600.0f;
	GetCharacterMovement()->AirControl = 0.2f;

	InventorySlots.SetNum(MaxInventorySize);
}

void ASurvivalCharacter::BeginPlay()
{
	Super::BeginPlay();

	if (APlayerController* PlayerController = Cast<APlayerController>(Controller))
	{
		if (UEnhancedInputLocalPlayerSubsystem* Subsystem = ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(PlayerController->GetLocalPlayer()))
		{
			Subsystem->AddMappingContext(GetDefault<UInputMappingContext>(), 0);
		}
	}
}

void ASurvivalCharacter::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	UpdateSurvivalStats(DeltaTime);
}

void ASurvivalCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	Super::SetupPlayerInputComponent(PlayerInputComponent);

	if (UEnhancedInputComponent* EnhancedInputComponent = Cast<UEnhancedInputComponent>(PlayerInputComponent))
	{
		EnhancedInputComponent->BindAction(MoveAction, ETriggerEvent::Triggered, this, &ASurvivalCharacter::Move);
		EnhancedInputComponent->BindAction(LookAction, ETriggerEvent::Triggered, this, &ASurvivalCharacter::Look);
		EnhancedInputComponent->BindAction(JumpAction, ETriggerEvent::Started, this, &ASurvivalCharacter::StartJump);
		EnhancedInputComponent->BindAction(JumpAction, ETriggerEvent::Completed, this, &ASurvivalCharacter::StopJump);
		EnhancedInputComponent->BindAction(SprintAction, ETriggerEvent::Started, this, &ASurvivalCharacter::StartSprint);
		EnhancedInputComponent->BindAction(SprintAction, ETriggerEvent::Completed, this, &ASurvivalCharacter::StopSprint);
		EnhancedInputComponent->BindAction(InteractAction, ETriggerEvent::Started, this, &ASurvivalCharacter::Interact);
		EnhancedInputComponent->BindAction(ToggleInventoryAction, ETriggerEvent::Started, this, &ASurvivalCharacter::ToggleInventory);
		EnhancedInputComponent->BindAction(ToggleCraftingAction, ETriggerEvent::Started, this, &ASurvivalCharacter::ToggleCrafting);
		EnhancedInputComponent->BindAction(PauseAction, ETriggerEvent::Started, this, &ASurvivalCharacter::PauseGame);
		EnhancedInputComponent->BindAction(CrouchAction, ETriggerEvent::Started, this, &ASurvivalCharacter::StartCrouch);
		EnhancedInputComponent->BindAction(CrouchAction, ETriggerEvent::Completed, this, &ASurvivalCharacter::StopCrouch);
		EnhancedInputComponent->BindAction(AttackAction, ETriggerEvent::Started, this, &ASurvivalCharacter::Attack);
	}
}

void ASurvivalCharacter::Move(const FInputActionValue& Value)
{
	const FVector2D MovementVector = Value.Get<FVector2D>();

	if (Controller != nullptr)
	{
		const FRotator Rotation = Controller->GetControlRotation();
		const FRotator YawRotation(0, Rotation.Yaw, 0);

		const FVector ForwardDirection = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X);
		const FVector RightDirection = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::Y);

		AddMovementInput(ForwardDirection, MovementVector.Y);
		AddMovementInput(RightDirection, MovementVector.X);
	}
}

void ASurvivalCharacter::Look(const FInputActionValue& Value)
{
	const FVector2D LookAxisVector = Value.Get<FVector2D>();

	if (Controller != nullptr)
	{
		AddControllerYawInput(LookAxisVector.X);
		AddControllerPitchInput(LookAxisVector.Y);
	}
}

void ASurvivalCharacter::StartJump()
{
	if (CanJump())
	{
		Jump();
	}
}

void ASurvivalCharacter::StopJump()
{
	StopJumping();
}

void ASurvivalCharacter::StartSprint()
{
	if (!bIsSprinting)
	{
		bIsSprinting = true;
		UpdateMovementSpeed();
	}
}

void ASurvivalCharacter::StopSprint()
{
	if (bIsSprinting)
	{
		bIsSprinting = false;
		UpdateMovementSpeed();
	}
}

void ASurvivalCharacter::Interact()
{
	UE_LOG(LogTemp, Log, TEXT("Interact pressed"));
}

void ASurvivalCharacter::ToggleInventory()
{
	UE_LOG(LogTemp, Log, TEXT("Toggle inventory"));
}

void ASurvivalCharacter::ToggleCrafting()
{
	UE_LOG(LogTemp, Log, TEXT("Toggle crafting"));
}

void ASurvivalCharacter::PauseGame()
{
	UE_LOG(LogTemp, Log, TEXT("Pause game"));
}

void ASurvivalCharacter::StartCrouch()
{
	if (!bIsCrouching)
	{
		bIsCrouching = true;
		UpdateMovementSpeed();
	}
}

void ASurvivalCharacter::StopCrouch()
{
	if (bIsCrouching)
	{
		bIsCrouching = false;
		UpdateMovementSpeed();
	}
}

void ASurvivalCharacter::Attack()
{
	UE_LOG(LogTemp, Log, TEXT("Attack pressed"));
}

void ASurvivalCharacter::UpdateSurvivalStats(float DeltaTime)
{
	float SpeedMultiplier = 1.0f;
	if (bIsSprinting)
	{
		SpeedMultiplier = 1.5f;
	}
	if (bIsCrouching)
	{
		SpeedMultiplier = 0.8f;
	}

	Hunger = FMath::Clamp(Hunger - (HungerDecayRate * SpeedMultiplier * DeltaTime), 0.0f, MaxHunger);
	Thirst = FMath::Clamp(Thirst - (ThirstDecayRate * SpeedMultiplier * DeltaTime), 0.0f, MaxThirst);
	Energy = FMath::Clamp(Energy - (EnergyDecayRate * SpeedMultiplier * DeltaTime), 0.0f, MaxEnergy);

	if (Hunger <= 0.0f)
	{
		TakeDamage(5.0f * DeltaTime);
	}

	if (Thirst <= 0.0f)
	{
		TakeDamage(8.0f * DeltaTime);
	}

	if (Energy <= 0.0f)
	{
		if (bIsSprinting)
		{
			StopSprint();
		}
	}

	if (Health <= 0.0f)
	{
		Destroy();
	}
}

void ASurvivalCharacter::TakeDamage(float DamageAmount)
{
	Health = FMath::Clamp(Health - DamageAmount, 0.0f, MaxHealth);

	if (Health <= 0.0f)
	{
		UE_LOG(LogTemp, Warning, TEXT("Player died!"));
	}
}

void ASurvivalCharacter::Heal(float HealAmount)
{
	Health = FMath::Clamp(Health + HealAmount, 0.0f, MaxHealth);
}

void ASurvivalCharacter::Feed(float FoodAmount)
{
	Hunger = FMath::Clamp(Hunger + FoodAmount, 0.0f, MaxHunger);
	Energy = FMath::Clamp(Energy + (FoodAmount * 0.3f), 0.0f, MaxEnergy);
}

void ASurvivalCharacter::Drink(float WaterAmount)
{
	Thirst = FMath::Clamp(Thirst + WaterAmount, 0.0f, MaxThirst);
}

void ASurvivalCharacter::Rest(float EnergyAmount)
{
	Energy = FMath::Clamp(Energy + EnergyAmount, 0.0f, MaxEnergy);
}

float ASurvivalCharacter::GetHealthPercentage() const
{
	return MaxHealth > 0.0f ? Health / MaxHealth : 0.0f;
}

float ASurvivalCharacter::GetHungerPercentage() const
{
	return MaxHunger > 0.0f ? Hunger / MaxHunger : 0.0f;
}

float ASurvivalCharacter::GetThirstPercentage() const
{
	return MaxThirst > 0.0f ? Thirst / MaxThirst : 0.0f;
}

float ASurvivalCharacter::GetEnergyPercentage() const
{
	return MaxEnergy > 0.0f ? Energy / MaxEnergy : 0.0f;
}

bool ASurvivalCharacter::AddItem(const FItemData& ItemData, int32 Quantity)
{
	if (ItemData.MaxStackSize > 1)
	{
		int32 ExistingIndex;
		if (FindExistingSlot(ItemData.ItemName, ExistingIndex))
		{
			InventorySlots[ExistingIndex].Quantity += Quantity;
			return true;
		}
	}

	int32 EmptyIndex;
	if (FindEmptySlot(EmptyIndex))
	{
		FInventorySlot NewSlot;
		NewSlot.ItemData = ItemData;
		NewSlot.Quantity = Quantity;
		InventorySlots[EmptyIndex] = NewSlot;
		return true;
	}

	return false;
}

bool ASurvivalCharacter::RemoveItem(const FString& ItemName, int32 Quantity)
{
	int32 ExistingIndex;
	if (FindExistingSlot(ItemName, ExistingIndex))
	{
		if (InventorySlots[ExistingIndex].Quantity >= Quantity)
		{
			InventorySlots[ExistingIndex].Quantity -= Quantity;

			if (InventorySlots[ExistingIndex].Quantity <= 0)
			{
				InventorySlots[ExistingIndex] = FInventorySlot();
			}

			return true;
		}
	}

	return false;
}

int32 ASurvivalCharacter::GetItemCount(const FString& ItemName) const
{
	for (const FInventorySlot& Slot : InventorySlots)
	{
		if (Slot.ItemData.ItemName == ItemName)
		{
			return Slot.Quantity;
		}
	}

	return 0;
}

bool ASurvivalCharacter::HasItem(const FString& ItemName, int32 Quantity) const
{
	return GetItemCount(ItemName) >= Quantity;
}

bool ASurvivalCharacter::FindEmptySlot(int32& OutIndex)
{
	for (int32 i = 0; i < InventorySlots.Num(); ++i)
	{
		if (InventorySlots[i].Quantity <= 0)
		{
			OutIndex = i;
			return true;
		}
	}

	return false;
}

bool ASurvivalCharacter::FindExistingSlot(const FString& ItemName, int32& OutIndex)
{
	for (int32 i = 0; i < InventorySlots.Num(); ++i)
	{
		if (InventorySlots[i].ItemData.ItemName == ItemName)
		{
			OutIndex = i;
			return true;
		}
	}

	return false;
}

void ASurvivalCharacter::UpdateMovementSpeed()
{
	float SpeedMultiplier = 1.0f;

	if (bIsSprinting)
	{
		SpeedMultiplier = SprintSpeedMultiplier;
	}

	if (bIsCrouching)
	{
		SpeedMultiplier = CrouchSpeedMultiplier;
	}

	GetCharacterMovement()->MaxWalkSpeed = BaseWalkSpeed * SpeedMultiplier;
}
