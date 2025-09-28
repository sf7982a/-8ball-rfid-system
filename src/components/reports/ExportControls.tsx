import { useState } from 'react'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import { toast } from 'sonner'
import {
  Download,
  FileText,
  FileSpreadsheet,
  Mail,
  Calendar,
  BarChart3
} from 'lucide-react'

interface ExportControlsProps {
  data: any
  locationName: string
  dateRange: { from: Date; to: Date }
  className?: string
}

export function ExportControls({ data, locationName, dateRange, className }: ExportControlsProps) {
  const [exportType, setExportType] = useState<'csv' | 'excel' | 'pdf'>('csv')
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeSummary, setIncludeSummary] = useState(true)
  const [includeDetails, setIncludeDetails] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [emailRecipients, setEmailRecipients] = useState('')

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const exportData = prepareExportData()

      switch (exportType) {
        case 'csv':
          await exportToCsv(exportData)
          break
        case 'excel':
          await exportToExcel(exportData)
          break
        case 'pdf':
          await exportToPdf(exportData)
          break
      }

      toast.success('Export completed successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleEmailReport = async () => {
    if (!emailRecipients) {
      toast.error('Please enter email recipients')
      return
    }

    setIsExporting(true)
    try {
      // In a real implementation, this would call an API to send the email
      console.log('Sending email report to:', emailRecipients)
      toast.success('Report email sent successfully')
    } catch (error) {
      console.error('Email error:', error)
      toast.error('Failed to send email')
    } finally {
      setIsExporting(false)
    }
  }

  const prepareExportData = () => {
    const exportData: any = {
      metadata: {
        exportDate: new Date().toISOString(),
        location: locationName,
        dateRange: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        },
        reportType: 'POS Analytics & Variance Detection'
      }
    }

    if (includeSummary) {
      exportData.summary = {
        totalRevenue: data.totalRevenue,
        totalBottlesTracked: data.totalBottlesTracked,
        theftIncidents: data.theftIncidents,
        inventoryAccuracy: data.inventoryAccuracy,
        costSavings: data.costSavings,
        pourCostPercentage: data.pourCostPercentage,
        inventoryTurnover: data.inventoryTurnover
      }
    }

    if (includeDetails) {
      exportData.details = {
        dailyRevenue: data.dailyRevenue,
        dailyThefts: data.dailyThefts,
        dailyAccuracy: data.dailyAccuracy,
        tierBreakdown: {
          premium: data.premiumTierRevenue,
          midTier: data.midTierRevenue,
          well: data.wellTierRevenue
        },
        varianceData: {
          openVariances: data.openVariances,
          criticalVariances: data.criticalVariances,
          resolvedVariances: data.resolvedVariances,
          falsePositives: data.falsePositives
        }
      }
    }

    return exportData
  }

  const exportToCsv = async (exportData: any) => {
    const csvContent = convertToCSV(exportData)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', generateFileName('csv'))
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToExcel = async (exportData: any) => {
    // In a real implementation, you would use a library like xlsx
    // For now, we'll just download as CSV with .xlsx extension
    const csvContent = convertToCSV(exportData)
    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', generateFileName('xlsx'))
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPdf = async (exportData: any) => {
    // In a real implementation, you would use a library like jsPDF or generate on the server
    // For now, we'll create a basic HTML report and trigger print
    const reportWindow = window.open('', '_blank')
    if (!reportWindow) return

    const htmlContent = generateHtmlReport(exportData)
    reportWindow.document.write(htmlContent)
    reportWindow.document.close()

    // Trigger print dialog
    setTimeout(() => {
      reportWindow.print()
    }, 500)
  }

  const convertToCSV = (exportData: any) => {
    let csv = 'POS Analytics & Variance Detection Report\n\n'

    // Metadata
    csv += 'Report Information\n'
    csv += `Generated,${new Date(exportData.metadata.exportDate).toLocaleString()}\n`
    csv += `Location,${exportData.metadata.location}\n`
    csv += `Date Range,${new Date(exportData.metadata.dateRange.from).toLocaleDateString()} - ${new Date(exportData.metadata.dateRange.to).toLocaleDateString()}\n\n`

    // Summary
    if (exportData.summary) {
      csv += 'Executive Summary\n'
      csv += 'Metric,Value\n'
      csv += `Total Revenue,$${exportData.summary.totalRevenue.toLocaleString()}\n`
      csv += `Bottles Tracked,${exportData.summary.totalBottlesTracked}\n`
      csv += `Theft Incidents,${exportData.summary.theftIncidents}\n`
      csv += `Inventory Accuracy,${exportData.summary.inventoryAccuracy.toFixed(1)}%\n`
      csv += `Cost Savings,$${exportData.summary.costSavings.toLocaleString()}\n`
      csv += `Pour Cost Percentage,${exportData.summary.pourCostPercentage.toFixed(1)}%\n`
      csv += `Inventory Turnover,${exportData.summary.inventoryTurnover.toFixed(1)}x\n\n`
    }

    // Daily Revenue Data
    if (exportData.details?.dailyRevenue) {
      csv += 'Daily Revenue Trends\n'
      csv += 'Date,Revenue,Bottles Sold\n'
      exportData.details.dailyRevenue.forEach((day: any) => {
        csv += `${day.date},$${day.revenue.toFixed(2)},${day.bottles}\n`
      })
      csv += '\n'
    }

    // Daily Theft Data
    if (exportData.details?.dailyThefts) {
      csv += 'Daily Theft Incidents\n'
      csv += 'Date,Incidents,Value Lost\n'
      exportData.details.dailyThefts.forEach((day: any) => {
        csv += `${day.date},${day.incidents},$${day.value.toFixed(2)}\n`
      })
      csv += '\n'
    }

    return csv
  }

  const generateHtmlReport = (exportData: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>POS Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>POS Analytics & Variance Detection Report</h1>
          <p>Location: ${exportData.metadata.location}</p>
          <p>Period: ${new Date(exportData.metadata.dateRange.from).toLocaleDateString()} - ${new Date(exportData.metadata.dateRange.to).toLocaleDateString()}</p>
          <p>Generated: ${new Date(exportData.metadata.exportDate).toLocaleString()}</p>
        </div>

        ${exportData.summary ? `
        <div class="section">
          <h2>Executive Summary</h2>
          <div class="summary-grid">
            <div class="metric-card">
              <div class="metric-value">$${exportData.summary.totalRevenue.toLocaleString()}</div>
              <div>Total Revenue</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${exportData.summary.totalBottlesTracked}</div>
              <div>Bottles Tracked</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${exportData.summary.theftIncidents}</div>
              <div>Theft Incidents</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${exportData.summary.inventoryAccuracy.toFixed(1)}%</div>
              <div>Inventory Accuracy</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">$${exportData.summary.costSavings.toLocaleString()}</div>
              <div>Cost Savings</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${exportData.summary.pourCostPercentage.toFixed(1)}%</div>
              <div>Pour Cost %</div>
            </div>
          </div>
        </div>
        ` : ''}

        <div class="section">
          <p><em>This report was generated by the 8Ball RFID Analytics System</em></p>
        </div>
      </body>
      </html>
    `
  }

  const generateFileName = (extension: string) => {
    const date = new Date().toISOString().split('T')[0]
    const location = locationName.replace(/[^a-zA-Z0-9]/g, '_')
    return `pos_analytics_${location}_${date}.${extension}`
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Analytics Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="export-type">Export Format</Label>
              <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV File
                    </div>
                  </SelectItem>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Excel File
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF Report
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Include in Export</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="summary"
                    checked={includeSummary}
                    onCheckedChange={setIncludeSummary}
                  />
                  <Label htmlFor="summary" className="text-sm">Executive Summary</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="details"
                    checked={includeDetails}
                    onCheckedChange={setIncludeDetails}
                  />
                  <Label htmlFor="details" className="text-sm">Detailed Data</Label>
                </div>
                {exportType === 'pdf' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="charts"
                      checked={includeCharts}
                      onCheckedChange={setIncludeCharts}
                    />
                    <Label htmlFor="charts" className="text-sm">Charts & Visualizations</Label>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? 'Exporting...' : `Export ${exportType.toUpperCase()}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Email Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="recipients">Email Recipients</Label>
              <textarea
                id="recipients"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
                placeholder="Enter email addresses separated by commas"
                className="w-full p-2 border rounded-md text-sm"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Multiple emails separated by commas
              </p>
            </div>

            <Button
              onClick={handleEmailReport}
              disabled={isExporting || !emailRecipients}
              className="w-full"
            >
              {isExporting ? 'Sending...' : 'Send Report'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button variant="outline" size="sm">
        <Calendar className="h-4 w-4 mr-2" />
        Schedule
      </Button>
    </div>
  )
}