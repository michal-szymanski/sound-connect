# Sound Connect UI Patterns

This reference contains musician-focused UI patterns used throughout Sound Connect.

## Table of Contents

1. [Profile Cards](#profile-cards)
2. [Band Page Layouts](#band-page-layouts)
3. [Instrument Displays](#instrument-displays)
4. [Genre Tags](#genre-tags)
5. [Availability Status](#availability-status)
6. [Discovery Interfaces](#discovery-interfaces)
7. [Match Indicators](#match-indicators)
8. [Empty States](#empty-states)
9. [Section Components](#section-components)

## Profile Cards

### User Quick Info Card

Compact card showing user identity with follow stats:

```tsx
<Card className="border-border/40">
    <CardContent className="relative p-4">
        <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
                <AvatarImage src={user.profileImageUrl} alt={user.name} />
                <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="text-muted-foreground truncate text-xs">@{username}</p>
            </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm">
            <span>
                <span className="text-foreground font-semibold">{followers}</span>
                <span className="text-muted-foreground ml-1">followers</span>
            </span>
            <span>
                <span className="text-foreground font-semibold">{following}</span>
                <span className="text-muted-foreground ml-1">following</span>
            </span>
        </div>
    </CardContent>
</Card>
```

### Member Card

Grid card for band members:

```tsx
<Card className="overflow-hidden transition-shadow hover:shadow-md">
    <CardContent className="p-4">
        <div className="flex items-start gap-3">
            <Avatar className="hover:ring-primary h-12 w-12 ring-2 ring-transparent transition-all">
                <AvatarImage src={member.profileImageUrl} alt={member.name} />
                <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold group-hover:underline">{member.name}</h3>
                    {member.isAdmin && (
                        <Badge variant="secondary" className="whitespace-nowrap">Admin</Badge>
                    )}
                </div>
                <p className="text-muted-foreground text-sm">Member since {joinedDate}</p>
            </div>
        </div>
    </CardContent>
</Card>
```

### Discovery Card

Card for band/musician discovery with match score:

```tsx
<Card
    className={cn(
        "group w-full cursor-pointer overflow-hidden transition-all hover:scale-[1.01] hover:shadow-lg",
        hasHighQualityMatch && "border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-950/10"
    )}
    tabIndex={0}
    role="button"
>
    <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16 flex-shrink-0">
                    <AvatarImage src={result.profileImageUrl} alt={result.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold">{result.name}</h3>
            </div>
            <MatchScoreBadge score={result.matchScore} />
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <span>{formatGenre(result.primaryGenre)}</span>
            <span>-</span>
            <span>{result.city}, {result.state} - {Math.round(result.distanceMiles)} mi</span>
        </div>
    </CardHeader>
    <CardContent className="space-y-3 pb-3">
        <div className="flex flex-wrap gap-2">
            {matchReasons.map((reason) => (
                <MatchReasonTag key={reason.type} reason={reason} />
            ))}
        </div>
    </CardContent>
    <CardFooter className="text-muted-foreground justify-between text-sm">
        <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{memberCount} members</span>
        </div>
        <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{followerCount} followers</span>
        </div>
    </CardFooter>
</Card>
```

## Band Page Layouts

### Band Header

Hero section with band info and actions:

```tsx
<div className="space-y-4">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarImage src={band.profileImageUrl} alt={band.name} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-2xl font-bold sm:text-3xl">{band.name}</h1>
                <p className="text-muted-foreground">{band.primaryGenre}</p>
                <p className="text-muted-foreground text-sm">
                    {band.city}, {band.state}
                </p>
            </div>
        </div>
        <div className="flex flex-wrap gap-2">
            <BandFollowButton bandId={band.id} />
            <BandMessageButton bandId={band.id} />
            <ApplyToBandButton band={band} />
        </div>
    </div>
</div>
```

### Tabbed Interface

Band page tab navigation:

```tsx
<Tabs defaultValue="posts" className="w-full">
    <TabsList className="w-full justify-start">
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        {isAdmin && (
            <TabsTrigger value="applications" className="relative">
                Applications
                {pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1">
                        {pendingCount}
                    </Badge>
                )}
            </TabsTrigger>
        )}
    </TabsList>
    <TabsContent value="posts" className="mt-4">
        {/* Posts content */}
    </TabsContent>
    <TabsContent value="about" className="mt-4">
        {/* About content */}
    </TabsContent>
</Tabs>
```

## Instrument Displays

### Primary Instrument with Years

```tsx
<div>
    <span className="font-medium">Primary:</span> {formatInstrument(instrument)}
    {yearsPlaying && ` (${yearsPlaying} years)`}
</div>
```

### Additional Instruments List

```tsx
<div>
    <span className="font-medium">Also plays:</span>{' '}
    {additionalInstruments.map((i) => (
        `${formatInstrument(i.instrument)} (${i.years} years)`
    )).join(', ')}
</div>
```

### Seeking to Play

```tsx
<div>
    <span className="font-medium">Seeking to play:</span>{' '}
    {seekingToPlay.map((i) => formatInstrument(i)).join(', ')}
</div>
```

### Instrument Formatting

```tsx
const formatInstrument = (instrument: string) => {
    return instrument
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
```

## Genre Tags

### Primary Genre Display

```tsx
<span className="text-muted-foreground">{formatGenre(primaryGenre)}</span>
```

### Genre Tag Collection

```tsx
<div className="flex flex-wrap gap-2">
    {genres.map((genre) => (
        <Badge key={genre} variant="secondary">
            {formatGenre(genre)}
        </Badge>
    ))}
</div>
```

### Genre Formatting

```tsx
const formatGenre = (genre: string) => {
    return genre
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
```

## Availability Status

### Status Configuration

```tsx
const availabilityStatusConfig = {
    actively_looking: {
        badge: 'outline',
        dot: 'bg-green-500',
        label: 'Actively Looking'
    },
    open_to_offers: {
        badge: 'outline',
        dot: 'bg-blue-500',
        label: 'Open to Offers'
    },
    not_looking: {
        badge: 'outline',
        dot: 'bg-gray-500',
        label: 'Not Looking'
    },
    just_browsing: {
        badge: 'outline',
        dot: 'bg-yellow-500',
        label: 'Just Browsing'
    }
};
```

### Status Indicator

Small dot with label:

```tsx
<div className="flex items-center gap-2">
    <span
        className={cn("h-2.5 w-2.5 rounded-full ring-background ring-2", config.dot)}
        aria-hidden="true"
    />
    <span>{config.label}</span>
</div>
```

### Status with Expiration

For "Actively Looking" status:

```tsx
<div className="flex items-center gap-2">
    <span className="font-medium">Status:</span>
    <span className="bg-green-500 h-2.5 w-2.5 rounded-full ring-background ring-2" />
    <span>Actively Looking</span>
    <span className="text-muted-foreground ml-2 text-sm">
        ({daysLeft} days left)
    </span>
</div>
```

### Status in Select Dropdown

```tsx
<Select value={status} onValueChange={setStatus}>
    <SelectTrigger>
        <SelectValue>
            <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full ring-background ring-2", config.dot)} />
                <span>{config.label}</span>
            </div>
        </SelectValue>
    </SelectTrigger>
    <SelectContent>
        {statuses.map((status) => (
            <SelectItem key={status} value={status}>
                <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full ring-background ring-2", statusConfig[status].dot)} />
                    <span>{statusConfig[status].label}</span>
                </div>
            </SelectItem>
        ))}
    </SelectContent>
</Select>
```

## Discovery Interfaces

### Search Filters Layout

```tsx
<div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
            <Label>Instruments</Label>
            <MultiSelect options={instruments} value={selected} onChange={setSelected} />
        </div>
        <div className="space-y-2">
            <Label>Genres</Label>
            <MultiSelect options={genres} value={selected} onChange={setSelected} />
        </div>
        <div className="space-y-2">
            <Label>Location</Label>
            <Input placeholder="City or ZIP" />
        </div>
        <div className="space-y-2">
            <Label>Radius</Label>
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="5">5 miles</SelectItem>
                    <SelectItem value="10">10 miles</SelectItem>
                    <SelectItem value="25">25 miles</SelectItem>
                    <SelectItem value="50">50 miles</SelectItem>
                    <SelectItem value="100">100 miles</SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
    <Button>Search</Button>
</div>
```

### Results Grid

```tsx
<div className="flex flex-col gap-4">
    {results.map((result) => (
        <DiscoveryCard key={result.id} result={result} />
    ))}
</div>
```

### Pagination

```tsx
<div className="flex items-center justify-center gap-2 pt-4">
    <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(page - 1)}
        disabled={!hasPreviousPage}
    >
        <ChevronLeft className="h-4 w-4" />
        Previous
    </Button>
    <span className="text-muted-foreground px-4 text-sm">
        Page {currentPage} of {totalPages}
    </span>
    <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(page + 1)}
        disabled={!hasNextPage}
    >
        Next
        <ChevronRight className="h-4 w-4" />
    </Button>
</div>
```

### Results Count

```tsx
<p className="text-muted-foreground text-sm">
    Showing {startIndex}-{endIndex} of {totalResults} matches
</p>
```

## Match Indicators

### Match Score Badge

```tsx
const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-green-500 text-white";
    if (score >= 40) return "bg-yellow-500 text-black";
    return "bg-muted text-muted-foreground";
};

<Badge className={cn("px-2 py-1", getScoreColor(score))}>
    {score}% match
</Badge>
```

### Match Reason Tags

```tsx
const getReasonIcon = (type: string) => {
    switch (type) {
        case 'instrument': return <Guitar className="h-3 w-3" />;
        case 'genre': return <Music className="h-3 w-3" />;
        case 'location': return <MapPin className="h-3 w-3" />;
        default: return null;
    }
};

<Badge variant="outline" className="gap-1">
    {getReasonIcon(reason.type)}
    {reason.label}
</Badge>
```

## Empty States

### No Matches

```tsx
<Card className="border-dashed">
    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <SearchX className="text-muted-foreground h-12 w-12 mb-4" />
        <h3 className="text-lg font-semibold">No matches found</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">
            Try adjusting your filters or expanding your search radius.
        </p>
        <Button variant="outline" className="mt-4">
            Clear Filters
        </Button>
    </CardContent>
</Card>
```

### Incomplete Profile

```tsx
<Card className="border-dashed">
    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <UserCog className="text-muted-foreground h-12 w-12 mb-4" />
        <h3 className="text-lg font-semibold">Complete your profile</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">
            Add your instruments, genres, and location to get personalized recommendations.
        </p>
        <Button asChild className="mt-4">
            <Link to="/users/$id" params={{ id: userId }}>
                Complete Profile
            </Link>
        </Button>
    </CardContent>
</Card>
```

## Section Components

### Profile Section Pattern

Collapsible/editable section with completion status:

```tsx
<Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {completionStatus === 'required' && (
                <Badge variant="destructive" className="text-xs">Required</Badge>
            )}
            {completionStatus === 'incomplete' && (
                <Badge variant="outline" className="text-xs">Incomplete</Badge>
            )}
        </div>
        {canEdit && (
            <Button variant="ghost" size="sm" onClick={toggleEdit}>
                <Pencil className="h-4 w-4" />
            </Button>
        )}
    </CardHeader>
    <CardContent>
        {isEditing ? editForm : displayContent}
    </CardContent>
</Card>
```

### Looking For Section

Highlighted section for band recruitment:

```tsx
<Card className="border-primary/20 bg-primary/5">
    <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
            <Search className="text-primary h-5 w-5" />
            <CardTitle className="text-base font-semibold">Looking For</CardTitle>
        </div>
    </CardHeader>
    <CardContent>
        <p className="text-foreground">{lookingFor}</p>
    </CardContent>
</Card>
```

### Skeleton Loading

```tsx
<Card className="overflow-hidden">
    <CardContent className="p-4">
        <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
            </div>
        </div>
    </CardContent>
</Card>
```
