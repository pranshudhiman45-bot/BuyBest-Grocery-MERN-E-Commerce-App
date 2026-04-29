import { useEffect, useState } from "react"
import { MapPin, Pencil, Plus, Trash2, TriangleAlert, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  selectAddress,
  updateAddress,
  type Address,
  type CreateAddressPayload,
} from "@/lib/store-api"

type AddressSectionProps = {
  isLoggedIn: boolean
  onRequireLogin: () => void
  onSelectionChange?: (address: Address | null) => void
}

type AddressFormState = CreateAddressPayload

const initialFormState: AddressFormState = {
  addressLine: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  mobile: "",
  country: "India",
  setAsDefault: true,
}

export function AddressSection({
  isLoggedIn,
  onRequireLogin,
  onSelectionChange,
}: AddressSectionProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [formState, setFormState] = useState<AddressFormState>(initialFormState)
  const [feedback, setFeedback] = useState("")
  const [isLoading, setIsLoading] = useState(isLoggedIn)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSelecting, setIsSelecting] = useState<string | null>(null)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) {
      return
    }

    const loadAddresses = async () => {
      setIsLoading(true)

      try {
        const response = await fetchAddresses()
        setAddresses(response.addresses)
        setSelectedAddressId(response.selectedAddressId)
        onSelectionChange?.(
          response.addresses.find((address) => address.id === response.selectedAddressId) ?? null
        )
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "Unable to load addresses.")
      } finally {
        setIsLoading(false)
      }
    }

    void loadAddresses()
  }, [isLoggedIn, onSelectionChange])

  const updateFormState = <Key extends keyof AddressFormState>(
    key: Key,
    value: AddressFormState[Key]
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const syncAddressResponse = (
    response: { addresses: Address[]; selectedAddressId: string | null },
    nextFeedback: string
  ) => {
    setAddresses(response.addresses)
    setSelectedAddressId(response.selectedAddressId)
    setFeedback(nextFeedback)
    onSelectionChange?.(
      response.addresses.find((address) => address.id === response.selectedAddressId) ?? null
    )
  }

  const resetForm = () => {
    setFormState(initialFormState)
    setEditingAddressId(null)
  }

  const handleCreateOrUpdateAddress = async () => {
    setIsSubmitting(true)
    setFeedback("")

    try {
      const response = editingAddressId
        ? await updateAddress(editingAddressId, formState)
        : await createAddress(formState)
      syncAddressResponse(response, response.message)
      resetForm()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to save address.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectAddress = async (addressId: string) => {
    setIsSelecting(addressId)
    setFeedback("")

    try {
      const response = await selectAddress(addressId)
      setAddresses(response.addresses)
      setSelectedAddressId(response.selectedAddressId)
      setFeedback(response.message)
      onSelectionChange?.(
        response.addresses.find((address) => address.id === response.selectedAddressId) ?? null
      )
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to select address.")
    } finally {
      setIsSelecting(null)
    }
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address.id)
    setFeedback("")
    setFormState({
      addressLine: address.addressLine,
      street: address.street || "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      mobile: address.mobile,
      country: address.country || "India",
      setAsDefault: address.isDefault,
    })
  }

  const handleDeleteAddress = async (addressId: string) => {
    setDeletingAddressId(addressId)
    setFeedback("")

    try {
      const response = await deleteAddress(addressId)
      syncAddressResponse(response, response.message)
      if (editingAddressId === addressId) {
        resetForm()
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to delete address.")
    } finally {
      setDeletingAddressId(null)
    }
  }

  if (!isLoggedIn) {
    return (
      <section className="rounded-[22px] border border-[#ece4d6] bg-white/82 p-4 shadow-[0_12px_28px_rgba(78,62,31,0.05)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9b8a69]">
              Delivery address
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[#2c2417]">Save an address before checkout</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#7d6d52]">
              Address management is connected to your account, so please sign in first and then add your delivery details here.
            </p>
          </div>
          <Button
            type="button"
            className="rounded-2xl bg-[#1B4D3E] hover:bg-[#163d32]"
            onClick={onRequireLogin}
          >
            Login to add address
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-[22px] border border-[#ece4d6] bg-white/82 p-4 shadow-[0_12px_28px_rgba(78,62,31,0.05)] sm:p-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9b8a69]">
          Delivery address
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[#2c2417]">Choose where this order should go</h2>
        <p className="mt-1 text-sm text-[#7d6d52]">
          Add a new address or select an existing one. Your selected address will be used at checkout.
        </p>
      </div>

      {feedback ? (
        <Alert className="border-[#eadfca] bg-[#fff9ef] text-[#6a5620]">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Address update</AlertTitle>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="rounded-[18px] border border-dashed border-[#e7dcc7] bg-[#fffdf8] px-4 py-6 text-sm text-[#7d6d52]">
          Loading your saved addresses...
        </div>
      ) : addresses.length > 0 ? (
        <div className="grid gap-3">
          {addresses.map((address) => {
            const isSelected = address.id === selectedAddressId

            return (
              <div
                key={address.id}
                role="button"
                tabIndex={0}
                onClick={() => void handleSelectAddress(address.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    void handleSelectAddress(address.id)
                  }
                }}
                className={`rounded-[18px] border p-4 text-left transition ${
                  isSelected
                    ? "border-[#1B4D3E] bg-[#f2faf6] shadow-sm"
                    : "border-[#ece4d6] bg-[#fffdfa] hover:border-[#d4c6a8]"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#2c2417]">
                      <MapPin className="h-4 w-4 text-[#a78410]" />
                      <span className="break-words">{address.addressLine}</span>
                    </div>
                    <p className="break-words text-sm leading-6 text-[#6f6148]">
                      {[address.street, address.city, address.state, address.postalCode, address.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="break-all text-sm text-[#6f6148]">Phone: {address.mobile}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {address.isDefault ? (
                      <span className="rounded-full bg-[#e3f3ea] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#1B4D3E]">
                        Default
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-full border border-[#e8dcc7] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6a5620] transition hover:bg-[#faf4e8]"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleEditAddress(address)
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Pencil className="h-3 w-3" />
                        Edit
                      </span>
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-[#efd5d5] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#b42318] transition hover:bg-[#fff5f5]"
                      onClick={(event) => {
                        event.stopPropagation()
                        void handleDeleteAddress(address.id)
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trash2 className="h-3 w-3" />
                        {deletingAddressId === address.id ? "Deleting..." : "Delete"}
                      </span>
                    </button>
                    <span className="rounded-full bg-[#fff7dd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6a5620]">
                      {isSelecting === address.id
                        ? "Saving..."
                        : isSelected
                          ? "Selected"
                          : "Use this"}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-[18px] border border-dashed border-[#e7dcc7] bg-[#fffdf8] px-4 py-6 text-sm text-[#7d6d52]">
          No saved addresses yet. Add your first delivery address below.
        </div>
      )}

      <div className="rounded-[20px] border border-[#ece4d6] bg-[#fffcf5] p-4">
        <div className="flex items-center gap-2 text-[#2c2417]">
          <Plus className="h-4 w-4 text-[#a78410]" />
          <h3 className="text-lg font-semibold">
            {editingAddressId ? "Edit saved address" : "Add a new address"}
          </h3>
        </div>

        {editingAddressId ? (
          <div className="mt-3 flex flex-col gap-3 rounded-[16px] border border-[#eadfca] bg-white px-4 py-3 text-sm text-[#6f6148] sm:flex-row sm:items-center sm:justify-between">
            <span>You are editing an existing address.</span>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 font-semibold text-[#624c11] transition hover:text-[#1B4D3E]"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address-line">Address line</Label>
            <Textarea
              id="address-line"
              value={formState.addressLine}
              onChange={(event) => updateFormState("addressLine", event.target.value)}
              placeholder="House number, apartment, landmark"
              className="min-h-24 border-[#dfd3be] bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="street">Street</Label>
            <Input
              id="street"
              value={formState.street}
              onChange={(event) => updateFormState("street", event.target.value)}
              placeholder="Street or area"
              className="border-[#dfd3be] bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formState.city}
              onChange={(event) => updateFormState("city", event.target.value)}
              placeholder="City"
              className="border-[#dfd3be] bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formState.state}
              onChange={(event) => updateFormState("state", event.target.value)}
              placeholder="State"
              className="border-[#dfd3be] bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postal-code">Postal code</Label>
            <Input
              id="postal-code"
              value={formState.postalCode}
              onChange={(event) => updateFormState("postalCode", event.target.value)}
              placeholder="Postal code"
              className="border-[#dfd3be] bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile</Label>
            <Input
              id="mobile"
              value={formState.mobile}
              onChange={(event) => updateFormState("mobile", event.target.value)}
              placeholder="Mobile number"
              className="border-[#dfd3be] bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formState.country}
              onChange={(event) => updateFormState("country", event.target.value)}
              placeholder="Country"
              className="border-[#dfd3be] bg-white"
            />
          </div>
        </div>

        <label className="mt-4 flex items-center gap-3 rounded-[16px] border border-[#eadfca] bg-white px-4 py-3 text-sm text-[#6f6148]">
          <input
            type="checkbox"
            checked={Boolean(formState.setAsDefault)}
            onChange={(event) => updateFormState("setAsDefault", event.target.checked)}
            className="h-4 w-4 rounded border-[#cdbb9a] text-[#1B4D3E] accent-[#1B4D3E]"
          />
          Set this as my default delivery address
        </label>

        <Button
          type="button"
          onClick={() => void handleCreateOrUpdateAddress()}
          disabled={isSubmitting}
          className="mt-4 w-full rounded-2xl bg-[#1B4D3E] hover:bg-[#163d32] sm:w-auto"
        >
          {isSubmitting
            ? editingAddressId
              ? "Updating address..."
              : "Saving address..."
            : editingAddressId
              ? "Update address"
              : "Save address"}
        </Button>
      </div>
    </section>
  )
}
