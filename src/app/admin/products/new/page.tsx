import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { ProductForm } from '@/components/admin/ProductForm';
import { RuleLabel } from '@/components/ui';
import { createProduct } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewProduct() {
  await requireAdmin();
  const categories = await db.category.findMany({ orderBy: { name: 'asc' } });

  return (
    <div>
      <RuleLabel>Catalogue</RuleLabel>
      <h1 className="mb-8 mt-2 text-[1.9rem]">Add product</h1>
      <ProductForm action={createProduct} categories={categories} submitLabel="Create product" />
    </div>
  );
}
