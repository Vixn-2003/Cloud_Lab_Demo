'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  LayoutGrid,
  List,
  Monitor,
  Cpu,
  Globe,
  X,
  FlaskConical,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScoreBadge } from '@/components/score-display';
import { EmptyState } from '@/components/empty-state';
import {
  sampleLabs,
  sampleFaculties,
  sampleSubjects,
  getBestScoreForLab,
} from '@/lib/sample-data';
import type { Lab } from '@/lib/types';

const envTypeConfig = {
  single_runtime: { label: 'Runtime', icon: Cpu },
  single_machine: { label: 'Machine', icon: Monitor },
  multi_node: { label: 'Multi-node', icon: Globe },
};

export function LabBrowserContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>(
    searchParams.get('facultyId')?.split(',').filter(Boolean) || []
  );
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    searchParams.get('subjectId')?.split(',').filter(Boolean) || []
  );
  const [selectedEnvTypes, setSelectedEnvTypes] = useState<string[]>(
    searchParams.get('envType')?.split(',').filter(Boolean) || []
  );

  // Get subjects for selected faculties
  const availableSubjects = useMemo(() => {
    if (selectedFaculties.length === 0) return sampleSubjects;
    return sampleSubjects.filter((s) => selectedFaculties.includes(s.facultyId));
  }, [selectedFaculties]);

  // Filter labs
  const filteredLabs = useMemo(() => {
    return sampleLabs.filter((lab) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = lab.title.toLowerCase().includes(query);
        const matchesToolset = lab.toolset?.some((t) =>
          t.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesToolset) return false;
      }

      // Subject filter (labs don't have direct subjectId, so we'll use a simple mapping)
      if (selectedSubjects.length > 0) {
        // For demo, we assume the lab's subject is derived from its id pattern
        const labSubjectMap: Record<string, string> = {
          sum_two_numbers: 'algos',
          lab_gen_hash: 'crypto_fundamentals',
          lab_openssl_hmac: 'crypto_fundamentals',
          lab_avalanche: 'crypto_fundamentals',
          lab_bruteforce_mock: 'crypto_fundamentals',
          lab_winlocker_analysis: 'net_sec',
        };
        if (!selectedSubjects.includes(labSubjectMap[lab.id] || '')) return false;
      }

      // Faculty filter
      if (selectedFaculties.length > 0) {
        const labSubjectMap: Record<string, string> = {
          sum_two_numbers: 'soft_eng',
          lab_gen_hash: 'info_sec',
          lab_openssl_hmac: 'info_sec',
          lab_avalanche: 'info_sec',
          lab_bruteforce_mock: 'info_sec',
          lab_winlocker_analysis: 'info_sec',
        };
        if (!selectedFaculties.includes(labSubjectMap[lab.id] || '')) return false;
      }

      // Env type filter
      if (selectedEnvTypes.length > 0) {
        if (!selectedEnvTypes.includes(lab.environmentType)) return false;
      }

      return true;
    });
  }, [searchQuery, selectedFaculties, selectedSubjects, selectedEnvTypes]);

  const toggleFilter = (
    value: string,
    selected: string[],
    setSelected: (v: string[]) => void
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const clearAllFilters = () => {
    setSelectedFaculties([]);
    setSelectedSubjects([]);
    setSelectedEnvTypes([]);
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedFaculties.length > 0 ||
    selectedSubjects.length > 0 ||
    selectedEnvTypes.length > 0 ||
    searchQuery;

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Filter Sidebar */}
      <div className="w-64 shrink-0 border-r border-border bg-card/50 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Filters</h2>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-auto py-1 px-2 text-xs"
            >
              Reset All
            </Button>
          )}
        </div>

        {/* Faculty Filter */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Faculty</h3>
          {sampleFaculties.map((faculty) => (
            <div key={faculty.id} className="flex items-center space-x-2">
              <Checkbox
                id={`faculty-${faculty.id}`}
                checked={selectedFaculties.includes(faculty.id)}
                onCheckedChange={() =>
                  toggleFilter(faculty.id, selectedFaculties, setSelectedFaculties)
                }
              />
              <Label
                htmlFor={`faculty-${faculty.id}`}
                className="text-sm cursor-pointer"
              >
                {faculty.title.replace('Faculty of ', '')}
              </Label>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Subject Filter */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Subject</h3>
          {availableSubjects.map((subject) => (
            <div key={subject.id} className="flex items-center space-x-2">
              <Checkbox
                id={`subject-${subject.id}`}
                checked={selectedSubjects.includes(subject.id)}
                onCheckedChange={() =>
                  toggleFilter(subject.id, selectedSubjects, setSelectedSubjects)
                }
              />
              <Label
                htmlFor={`subject-${subject.id}`}
                className="text-sm cursor-pointer"
              >
                {subject.title}
              </Label>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Env Type Filter */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Environment Type
          </h3>
          {Object.entries(envTypeConfig).map(([key, config]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={`env-${key}`}
                checked={selectedEnvTypes.includes(key)}
                onCheckedChange={() =>
                  toggleFilter(key, selectedEnvTypes, setSelectedEnvTypes)
                }
              />
              <Label htmlFor={`env-${key}`} className="text-sm cursor-pointer flex items-center gap-1.5">
                <config.icon className="h-3.5 w-3.5" />
                {config.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Labs</h1>
            <p className="text-sm text-muted-foreground">
              Showing {filteredLabs.length} labs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search labs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
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
            <div className="flex items-center border border-border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Labs Grid/List */}
        {filteredLabs.length === 0 ? (
          <EmptyState
            icon={<FlaskConical className="h-8 w-8 text-muted-foreground" />}
            title="No labs found"
            description="Try adjusting your filters or search query."
            action={
              hasActiveFilters && (
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              )
            }
          />
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLabs.map((lab) => (
              <LabCard key={lab.id} lab={lab} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLabs.map((lab) => (
              <LabListItem key={lab.id} lab={lab} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LabCard({ lab }: { lab: Lab }) {
  const EnvIcon = envTypeConfig[lab.environmentType].icon;
  const bestScore = getBestScoreForLab(lab.id);
  const isCompleted = bestScore === 100;

  return (
    <Link
      href={`/labs/${lab.id}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:bg-accent/50 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <EnvIcon className="h-5 w-5 text-primary" />
        </div>
        {bestScore !== undefined && <ScoreBadge score={bestScore} />}
      </div>

      <h3 className="mt-4 font-semibold line-clamp-2">{lab.title}</h3>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {lab.toolset?.slice(0, 3).map((tool) => (
          <Badge key={tool} variant="secondary" className="text-xs">
            {tool}
          </Badge>
        ))}
        {lab.toolset && lab.toolset.length > 3 && (
          <Badge variant="secondary" className="text-xs">
            +{lab.toolset.length - 3}
          </Badge>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <EnvIcon className="h-3 w-3" />
          {envTypeConfig[lab.environmentType].label}
        </span>
        <span className="font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          {isCompleted ? 'Review' : bestScore !== undefined ? 'Continue' : 'Start'} →
        </span>
      </div>
    </Link>
  );
}

function LabListItem({ lab }: { lab: Lab }) {
  const EnvIcon = envTypeConfig[lab.environmentType].icon;
  const bestScore = getBestScoreForLab(lab.id);
  const isCompleted = bestScore === 100;

  return (
    <Link
      href={`/labs/${lab.id}`}
      className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/50"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <EnvIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">{lab.title}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <EnvIcon className="h-3 w-3" />
              {envTypeConfig[lab.environmentType].label}
            </span>
            {lab.toolset?.slice(0, 3).map((tool) => (
              <Badge key={tool} variant="secondary" className="text-xs">
                {tool}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {bestScore !== undefined && <ScoreBadge score={bestScore} />}
        <Button variant="outline" size="sm">
          {isCompleted ? 'Review' : bestScore !== undefined ? 'Continue' : 'Start'}
        </Button>
      </div>
    </Link>
  );
}
