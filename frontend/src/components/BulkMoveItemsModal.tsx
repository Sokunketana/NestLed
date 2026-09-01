import { FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react'
import { itemApi } from '../api/itemApi'
import type { BulkMoveItemsResponse, Room, StorageLocation } from '../types'

type BulkMoveItemsModalProps = {
  itemIds: number[]
  rooms: Room[]
  locations: StorageLocation[]
  onClose: () => void
  onMoved: (result: BulkMoveItemsResponse) => Promise<void> | void
}

export default function BulkMoveItemsModal({
  itemIds,
  rooms,
  locations,
  onClose,
  onMoved,
}: BulkMoveItemsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const roomSelectRef = useRef<HTMLSelectElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const errorId = useId()
  const [roomId, setRoomId] = useState('')
  const [storageLocationId, setStorageLocationId] = useState('')
  const [isMoving, setIsMoving] = useState(false)
  const [error, setError] = useState('')

  const destinationRoom = rooms.find(room => room.id === Number(roomId))
  const destinationLocation = locations.find(location => location.id === Number(storageLocationId))
  const availableLocations = useMemo(
    () => locations.filter(location => location.roomId === Number(roomId)),
    [locations, roomId],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null

    dialog?.showModal()
    roomSelectRef.current?.focus()

    return () => {
      if (dialog?.open) dialog.close()
      previouslyFocused?.focus()
    }
  }, [])

  function close() {
    if (!isMoving) onClose()
  }

  async function moveItems(event: FormEvent) {
    event.preventDefault()
    if (!roomId || !storageLocationId) return

    setError('')
    setIsMoving(true)
    try {
      const result = await itemApi.bulkMove({
        itemIds,
        roomId: Number(roomId),
        storageLocationId: Number(storageLocationId),
      })
      await onMoved(result)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to move these items. Please try again.')
      setIsMoving(false)
    }
  }

  const itemLabel = `${itemIds.length} ${itemIds.length === 1 ? 'item' : 'items'}`

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ''}`}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl border-0 bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
      onCancel={event => { event.preventDefault(); close() }}
      onClick={event => { if (event.target === event.currentTarget) close() }}
    >
      <form className="p-6 sm:p-7" onSubmit={moveItems}>
        <div className="grid h-12 w-12 place-items-center rounded-full bg-sage text-pine" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12m0 0-3-3m3 3-3 3m-1.5 7.5h-12m0 0 3 3m-3-3 3-3" />
          </svg>
        </div>
        <h2 id={titleId} className="mt-5 text-2xl">Move {itemLabel}</h2>
        <p id={descriptionId} className="mt-2 leading-relaxed text-stone-600">
          Choose where these items are stored now. Every selected item will be updated together.
        </p>

        <div className="mt-6">
          <label className="label" htmlFor={`${titleId}-room`}>Destination room</label>
          <select
            ref={roomSelectRef}
            id={`${titleId}-room`}
            className="field"
            value={roomId}
            onChange={event => {
              setRoomId(event.target.value)
              setStorageLocationId('')
              setError('')
            }}
            disabled={isMoving}
            required
          >
            <option value="">Select a room</option>
            {rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
          </select>
        </div>

        <div className="mt-4">
          <label className="label" htmlFor={`${titleId}-location`}>Destination storage location</label>
          <select
            id={`${titleId}-location`}
            className="field"
            value={storageLocationId}
            onChange={event => { setStorageLocationId(event.target.value); setError('') }}
            disabled={!roomId || isMoving}
            required
          >
            <option value="">Select a storage location</option>
            {availableLocations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
          {roomId && !availableLocations.length && (
            <p className="mt-2 text-sm text-amber-700">This room does not have a storage location yet.</p>
          )}
        </div>

        {destinationRoom && destinationLocation && (
          <div className="mt-5 rounded-2xl bg-sage/60 px-4 py-3 text-sm text-pine">
            <span className="font-semibold">Ready to move:</span> {itemLabel} to {destinationRoom.name} → {destinationLocation.name}
          </div>
        )}
        {error && <p id={errorId} role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={close} disabled={isMoving}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={!storageLocationId || isMoving}>
            {isMoving ? 'Moving items…' : `Move ${itemLabel}`}
          </button>
        </div>
      </form>
    </dialog>
  )
}
