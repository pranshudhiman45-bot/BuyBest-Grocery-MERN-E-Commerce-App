import { Card, CardContent } from "@/components/ui/card"
import { ProductImage } from "@/components/catalog/ProductImage"

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
          <ProductImage
            src={image}
            alt={title}
            width={80}
            height={80}
            sizes="40px"
            className="h-10 w-10"
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
