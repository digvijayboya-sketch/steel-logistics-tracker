export const cls = (...parts:(string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

export const formatINR = (n:number) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n)
export const formatDate = (s?:string) => s ? new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'
export const formatDateTime = (s?:string) => s ? new Date(s).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

export const getCoords = async (): Promise<{ lat?:number; lng?:number }> => {
  if (!('geolocation' in navigator)) return {}
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 5000 }
    )
  })
}
