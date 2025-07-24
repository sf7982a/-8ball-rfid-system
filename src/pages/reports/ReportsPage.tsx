import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InventoryAnalysisChart } from '../../components/reports/InventoryAnalysisChart'
import { InventoryTrends } from '../../components/reports/InventoryTrends'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartErrorBoundary } from '@/components/ui/ErrorBoundary'
import { BarChart3, TrendingUp, FileText, Calendar } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reports</h1>
      </div>
      
      <Tabs defaultValue="inventory-analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="inventory-analysis" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Inventory Analysis</span>
            <span className="sm:hidden">Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trends</span>
            <span className="sm:hidden">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Scheduled</span>
            <span className="sm:hidden">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Custom</span>
            <span className="sm:hidden">Custom</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory-analysis" className="space-y-4">
          <ChartErrorBoundary chartName="Inventory Analysis">
            <InventoryAnalysisChart />
          </ChartErrorBoundary>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <ChartErrorBoundary chartName="Inventory Trends">
            <InventoryTrends />
          </ChartErrorBoundary>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Scheduled Reports</span>
              </CardTitle>
              <CardDescription>
                Set up automated reports to be delivered via email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Scheduled reports coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Custom Reports</span>
              </CardTitle>
              <CardDescription>
                Create custom reports with your own filters and groupings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Custom report builder coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}