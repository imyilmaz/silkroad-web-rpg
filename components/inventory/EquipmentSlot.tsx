type EquipmentSlotProps = {
  icon?: string
}

export default function EquipmentSlot({ icon }: EquipmentSlotProps) {
  return (
    <div className="equipment-slot">
      {icon ? (
        <img src={`/icons/${icon}`} alt="" />
      ) : (
        <div className="empty" />
      )}
    </div>
  )
}
