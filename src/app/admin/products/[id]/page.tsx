import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { ProductForm } from '@/components/admin/ProductForm';
import { RuleLabel } from '@/components/ui';
import { updateProduct } from '../actions';

export const dynamic = 'force-dynamic';

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.category.findMany({ orderBy: { name: 'asc' } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <RuleLabel>Catalogue</RuleLabel>
      <h1 className="mb-8 mt-2 text-[1.9rem]">Edit “{product.name}”</h1>
      <ProductForm
        action={updateProduct.bind(null, id)}
        categories={categories}
        submitLabel="Save changes"
        defaults={{
          ...product,
          price: Number(product.price),
          mrp: product.mrp ? Number(product.mrp) : null,
          costPrice: product.costPrice ? Number(product.costPrice) : null,
          images: product.images,
          content: product.content ?? undefined,
          // <input type="date"> wants YYYY-MM-DD, not an ISO timestamp.
          expiryDate: product.expiryDate ? product.expiryDate.toISOString().slice(0, 10) : null,
          gstRate: product.gstRate ? Number(product.gstRate) : null,
        }}
      />
    </div>
  );
}
