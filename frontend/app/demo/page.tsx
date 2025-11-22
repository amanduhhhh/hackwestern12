'use client';

import { useState } from 'react';
import { useThemeStore } from '@/store/useThemeStore';
import { Card } from '@/components/core/Card';
import { List } from '@/components/core/List';
import { Table } from '@/components/core/Table';
import { Timeline } from '@/components/core/Timeline';
import { LineChart } from '@/components/core/LineChart';
import { BarChart } from '@/components/core/BarChart';
import type { ThemeName } from '@/components/types';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

// Mock data
const mockListData = [
    { id: 1, name: 'Dark Side of the Moon', artist: 'Pink Floyd', streams: '45.2M' },
    { id: 2, name: 'Abbey Road', artist: 'The Beatles', streams: '38.7M' },
    { id: 3, name: 'Thriller', artist: 'Michael Jackson', streams: '52.1M' },
    { id: 4, name: 'Back in Black', artist: 'AC/DC', streams: '31.5M' },
    { id: 5, name: 'The Wall', artist: 'Pink Floyd', streams: '28.9M' },
];

const mockTableData = [
    { id: 1, player: 'LeBron James', team: 'Lakers', points: 28.5, assists: 7.2, rebounds: 8.1 },
    { id: 2, player: 'Stephen Curry', team: 'Warriors', points: 31.2, assists: 6.8, rebounds: 5.4 },
    { id: 3, player: 'Kevin Durant', team: 'Suns', points: 29.8, assists: 5.1, rebounds: 7.3 },
    { id: 4, player: 'Giannis Antetokounmpo', team: 'Bucks', points: 32.1, assists: 5.9, rebounds: 11.2 },
];

const mockTimelineData = [
    { id: 1, title: 'Account Created', description: 'Welcome to our platform!', timestamp: '2024-11-20' },
    { id: 2, title: 'First Purchase', description: 'Bought Premium Plan', timestamp: '2024-11-21' },
    { id: 3, title: 'Profile Updated', description: 'Added profile picture', timestamp: '2024-11-22' },
    { id: 4, title: 'Referral Reward', description: 'Earned $10 credit', timestamp: '2024-11-22' },
];

const mockChartData = [
    { label: 'Jan', value: 4200 },
    { label: 'Feb', value: 5100 },
    { label: 'Mar', value: 4800 },
    { label: 'Apr', value: 6300 },
    { label: 'May', value: 7200 },
    { label: 'Jun', value: 6800 },
];

const mockPieData = [
    { label: 'Desktop', value: 45 },
    { label: 'Mobile', value: 35 },
    { label: 'Tablet', value: 20 },
];

export default function DemoPage() {
    const { currentTheme, setTheme } = useThemeStore();
    const [selectedTheme, setSelectedTheme] = useState<ThemeName>(currentTheme);

    const handleThemeChange = (theme: ThemeName) => {
        setSelectedTheme(theme);
        setTheme(theme);
    };

    return (
        <div className="min-h-screen bg-background p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header with Theme Switcher */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">Component Demo</h1>
                        <p className="text-muted-foreground">Showcase of all themed components</p>
                    </div>

                    <div className="flex gap-3">
                        {(['tokyo-night', 'impact', 'elegant'] as ThemeName[]).map((theme) => (
                            <button
                                key={theme}
                                onClick={() => handleThemeChange(theme)}
                                className={`px-6 py-3 font-semibold transition-all ${
                                    theme === 'impact' ? '' : 'rounded-lg'
                                } ${selectedTheme === theme
                                        ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                                        : 'bg-card hover:bg-card/80 text-foreground'
                                    }`}
                            >
                                {theme === 'tokyo-night' && ' Tokyo Night'}
                                {theme === 'impact' && ' Impact'}
                                {theme === 'elegant' && ' Elegant'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards Section */}
                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-6"> Cards</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card
                            variant="metric"
                            icon={<TrendingUp className="w-6 h-6" />}
                            title="Revenue"
                            value="$45,231"
                            trend={{ value: 12.5, label: '+12.5% from last month' }}
                        />
                        <Card
                            variant="metric"
                            icon={<Users className="w-6 h-6" />}
                            title="Active Users"
                            value="2,845"
                            trend={{ value: 8.2, label: '+8.2% from last week' }}
                        />
                        <Card
                            variant="stat"
                            title="Conversion Rate"
                            value="3.24%"
                            subtitle="Target: 4.0%"
                        />
                        <Card
                            variant="stat"
                            icon={<Activity className="w-6 h-6" />}
                            title="Engagement"
                            value="89.5%"
                            subtitle="All time high!"
                        />
                    </div>
                </section>

                {/* List Section */}
                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-6"> Lists</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-foreground">Ranked List</h3>
                            <List
                                items={mockListData}
                                template={{ primary: 'name', secondary: 'artist', meta: 'streams' }}
                                ranked={true}
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-foreground">Simple List</h3>
                            <List
                                items={mockListData.slice(0, 3)}
                                template={{ primary: 'name', secondary: 'artist' }}
                                ranked={false}
                            />
                        </div>
                    </div>
                </section>

                {/* Table Section */}
                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-6"> Table</h2>
                    <Table
                        columns={[
                            { key: 'player', label: 'Player', sortable: true },
                            { key: 'team', label: 'Team', sortable: true },
                            { key: 'points', label: 'PPG', sortable: true },
                            { key: 'assists', label: 'APG', sortable: true },
                            { key: 'rebounds', label: 'RPG', sortable: true },
                        ]}
                        data={mockTableData}
                    />
                </section>

                {/* Timeline Section */}
                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-6"> Timeline</h2>
                    <Timeline events={mockTimelineData} />
                </section>

                {/* Charts Section */}
                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-6"> Charts</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-foreground">Line Chart</h3>
                            <LineChart
                                data={mockChartData}
                                label="Monthly Revenue"
                                height={300}
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-foreground">Bar Chart</h3>
                            <BarChart
                                data={mockChartData}
                                label="Monthly Revenue"
                                height={300}
                            />
                        </div>
                    </div>
                </section>


                {/* Theme Showcase - All Cards in Current Theme */}
                <section className="mt-16">
                    <h2 className="text-2xl font-bold text-foreground mb-6">
                         Current Theme: {selectedTheme}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card
                            variant="default"
                            title="Default Card"
                            onClick={() => alert('Card clicked!')}
                        >
                            <p className="text-muted-foreground">
                                This is a default card with custom content. Click me!
                            </p>
                        </Card>
                        <Card
                            variant="metric"
                            icon={<DollarSign className="w-6 h-6" />}
                            title="Sales"
                            value="$125,430"
                            subtitle="This month"
                        />
                        <Card
                            variant="stat"
                            title="Success Rate"
                            value="94.2%"
                            trend={{ value: 5.1, label: '+5.1% improvement' }}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}
