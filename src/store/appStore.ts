import { create } from 'zustand'
import type { UserRole } from '@/types'

interface User { id:string; name:string; email:string; role:UserRole }
interface AuthState {
  user: User | null
  login: (email:string, password:string)=>boolean
  logout: ()=>void
}

const DEMO_USERS: (User & { password:string })[] = [
  { id:'u1', name:'Amit Kulkarni', email:'admin@steelco.in', role:'admin', password:'admin123' },
  { id:'u2', name:'Priya Shah', email:'purchase@steelco.in', role:'purchase', password:'steel123' },
  { id:'u3', name:'Rohan Jagtap', email:'planner@steelco.in', role:'planner', password:'steel123' },
  { id:'u4', name:'Mahesh Patil', email:'agent1@steelco.in', role:'agent', password:'agent123' },
  { id:'u5', name:'Sandeep More', email:'agent2@steelco.in', role:'agent', password:'agent123' },
]

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (email, password) => {
    const found = DEMO_USERS.find(u => u.email === email && u.password === password)
    if (!found) return false
    const { password: _, ...user } = found
    set({ user })
    return true
  },
  logout: () => set({ user: null }),
}))
