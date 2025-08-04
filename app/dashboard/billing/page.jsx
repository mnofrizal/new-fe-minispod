import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Download, CheckCircle, AlertCircle } from "lucide-react"

export default function BillingPage() {
  const currentPlan = {
    name: "Pro Plan",
    price: "$29.99",
    billing: "monthly",
    status: "active",
    nextBilling: "January 15, 2025",
    features: [
      "Unlimited apps",
      "Advanced analytics",
      "Priority support",
      "Custom domains",
      "API access"
    ]
  }

  const invoices = [
    {
      id: "INV-001",
      date: "Dec 15, 2024",
      amount: "$29.99",
      status: "paid",
      description: "Pro Plan - Monthly"
    },
    {
      id: "INV-002",
      date: "Nov 15, 2024",
      amount: "$29.99",
      status: "paid",
      description: "Pro Plan - Monthly"
    },
    {
      id: "INV-003",
      date: "Oct 15, 2024",
      amount: "$29.99",
      status: "paid",
      description: "Pro Plan - Monthly"
    },
    {
      id: "INV-004",
      date: "Sep 15, 2024",
      amount: "$29.99",
      status: "paid",
      description: "Pro Plan - Monthly"
    }
  ]

  const plans = [
    {
      name: "Starter",
      price: "$9.99",
      period: "month",
      features: ["Up to 3 apps", "Basic analytics", "Email support"],
      current: false
    },
    {
      name: "Pro",
      price: "$29.99",
      period: "month",
      features: ["Unlimited apps", "Advanced analytics", "Priority support", "Custom domains"],
      current: true
    },
    {
      name: "Enterprise",
      price: "$99.99",
      period: "month",
      features: ["Everything in Pro", "Dedicated support", "SLA guarantee", "Custom integrations"],
      current: false
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Current Plan</span>
            </CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                <p className="text-muted-foreground">{currentPlan.price}/{currentPlan.billing}</p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                {currentPlan.status}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Next billing date</p>
              <p className="font-medium">{currentPlan.nextBilling}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Features included</p>
              <ul className="space-y-1">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" className="flex-1">
                Change Plan
              </Button>
              <Button variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Manage your payment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/26</p>
              </div>
              <Badge variant="secondary">Default</Badge>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1">
                Update Card
              </Button>
              <Button variant="outline">
                Add Card
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Your billing history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{invoice.description}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{invoice.amount}</span>
                    <Badge className="bg-green-100 text-green-800">
                      {invoice.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Upgrade or downgrade your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plans.map((plan) => (
                <div 
                  key={plan.name} 
                  className={`p-4 border rounded-lg ${plan.current ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{plan.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${plan.price}/{plan.period}
                      </p>
                    </div>
                    {plan.current ? (
                      <Badge>Current</Badge>
                    ) : (
                      <Button variant="outline" size="sm">
                        Switch
                      </Button>
                    )}
                  </div>
                  <ul className="text-sm space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}