import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenu,
} from '../ui/sidebar'
import Icon from '../../assests/Icon.svg'
import Icon1 from '../../assests/Icon (1).svg'
import Icon2 from '../../assests/Icon (2).svg'
import Icon3 from '../../assests/Icon (3).svg'
import Icon4 from '../../assests/Icon (4).svg'  
import Icon5 from '../../assests/Icon (5).svg'
const categories = [
  { name: "Vegetables", icon: Icon },
  { name: "Dairy", icon: Icon1 },
  { name: "Snacks", icon: Icon2 },
  { name: "Beverages", icon: Icon3 },
  { name: "Household", icon: Icon4 },
  { name: "Personal Care", icon: Icon5 },
]

export function AppSidebar() {
  return (
    <Sidebar
      collapsible="none"
      className="border-r border-[#c7ebd1] bg-[linear-gradient(180deg,#f3fff5_0%,#e2f8e8_100%)]"
    >
      <SidebarHeader className="p-4 pb-3">
        <div className="rounded-[28px] bg-white/90 p-5 shadow-[0_18px_44px_rgba(18,75,53,0.08)] ring-1 ring-[#d4f0db]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#67a477]">
            Browse
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#154536]">
            Categories
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#68877b]">
            Fresh picks for your daily shopping.
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 pb-4">
        <SidebarGroup className="rounded-[28px] bg-white/88 p-3 shadow-[0_16px_40px_rgba(18,75,53,0.08)] ring-1 ring-[#d4f0db]">
          <SidebarMenu>
            {categories.map((category) => (
              <SidebarMenuItem key={category.name}>
                <SidebarMenuButton className="flex h-12 items-center gap-3 rounded-[18px] px-4 text-[15px] font-medium text-[#2b5a4a] transition-all duration-200 hover:bg-[#ddf6e2] hover:text-[#123d30] data-[active=true]:bg-[#c4f0cf] data-[active=true]:text-[#0e422f]">
                  <img
                    src={category.icon}
                    alt={category.name}
                    className="h-4 w-4 object-contain opacity-85"
                  />
                  

                  {category.name}
                  
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
