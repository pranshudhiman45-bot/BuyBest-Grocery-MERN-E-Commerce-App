import { Card, CardContent } from "@/components/ui/card"

type CategoryCardProps = {
  title: string
  image: string
}

export function CategoryCard({ title, image }: CategoryCardProps) {
  return (
    <Card className="w-37.5 h-52 rounded-2xl bg-[#CFE8DA] border-none shadow-sm hover:shadow-md transition-all cursor-pointer">
      <CardContent className="flex flex-col items-center justify-center h-full gap-3 p-4">
        
        {/* Image circle */}
        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
          <img
            src={image}
            alt={title}
            className="w-10 h-10 object-contain"
          />
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-[#1B4D3E]">
          {title}
        </p>
      </CardContent>
    </Card>
  )
}