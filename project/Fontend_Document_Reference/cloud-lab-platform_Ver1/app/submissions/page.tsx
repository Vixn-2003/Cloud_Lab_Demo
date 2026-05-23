'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  X,
  ArrowUpDown,
  FileText,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScoreBadge } from '@/components/score-display';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { sampleSubmissions } from '@/lib/sample-data';

export default function SubmissionsPage() {
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || 'all'
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get('sort') || 'date_desc'
  );

  const filteredSubmissions = useMemo(() => {
    let result = [...sampleSubmissions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.lab_title?.toLowerCase().includes(query) ||
          s.language.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status.toLowerCase() === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'score_desc':
          return (b.score || 0) - (a.score || 0);
        case 'score_asc':
          return (a.score || 0) - (b.score || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, statusFilter, sortBy]);

  return (
    <div className="animate-fade-in-up p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Submissions</h1>
        <p className="text-muted-foreground">
          View your submission history and grading results
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by lab name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Newest First</SelectItem>
            <SelectItem value="date_asc">Oldest First</SelectItem>
            <SelectItem value="score_desc">Highest Score</SelectItem>
            <SelectItem value="score_asc">Lowest Score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions Table */}
      {filteredSubmissions.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
          title="No submissions found"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Start by completing a lab to see your submissions here.'
          }
          action={
            <Button asChild>
              <Link href="/labs">Browse Labs</Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Lab Title</TableHead>
                <TableHead className="w-24">Language</TableHead>
                <TableHead className="w-24 text-right">Score</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-28 text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission, index) => (
                <TableRow
                  key={submission.id}
                  className="cursor-pointer"
                  asChild
                >
                  <Link href={`/submissions/${submission.id}`}>
                    <TableCell className="font-mono text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {submission.lab_title}
                    </TableCell>
                    <TableCell className="capitalize">
                      {submission.language}
                    </TableCell>
                    <TableCell className="text-right">
                      <ScoreBadge score={submission.score} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={submission.status} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </TableCell>
                  </Link>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredSubmissions.length} of {sampleSubmissions.length} submissions
        </span>
      </div>
    </div>
  );
}
