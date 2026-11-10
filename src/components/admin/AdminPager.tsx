import { Button } from '../ui/button';

interface AdminPagerProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Feature prefix for the test ids, e.g. `admin-gift-cards`. */
  testIdPrefix: string;
}

export function AdminPager({ page, totalPages, onPageChange, testIdPrefix }: AdminPagerProps) {
  return (
    <div className="flex items-center justify-between border-t border-stone-200 px-5 py-4">
      <span className="text-sm text-slate-500" data-testid={`${testIdPrefix}-page-indicator`}>Page {totalPages ? page + 1 : 0} of {totalPages}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0} data-testid={`${testIdPrefix}-previous-page`}>Previous</Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={totalPages === 0 || page >= totalPages - 1} data-testid={`${testIdPrefix}-next-page`}>Next</Button>
      </div>
    </div>
  );
}
