import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {  Store, Mail,  Users } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function Settings() {
  const [storeName, setStoreName] = useState('E-Store');
  const [storeEmail, setStoreEmail] = useState('support@e-store.com');
  const [shippingCost, setShippingCost] = useState('5.00');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('50.00');
  const [enableUserRegistration, setEnableUserRegistration] = useState(true);
  const [enableTwoFactorAuth, setEnableTwoFactorAuth] = useState(false);
  const [welcomeEmailContent, setWelcomeEmailContent] = useState('Welcome to E-Store! Thank you for signing up.');

  const handleSaveSettings = (settingName: string) => {
    toast.success(`${settingName} settings saved! (Placeholder)`);
    console.log(`Saving ${settingName} settings.`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <p className="text-muted-foreground">Manage your store's configuration and preferences.</p>

      {/* General Store Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" /> General Store Settings
          </CardTitle>
          <CardDescription>Configure basic information about your online store.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input
                id="store-name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-email">Contact Email</Label>
              <Input
                id="store-email"
                type="email"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={() => handleSaveSettings('General')}>Save General Settings</Button>
        </CardContent>
      </Card>

      {/* Shipping Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" /> Shipping Settings
          </CardTitle>
          <CardDescription>Manage shipping costs and options.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipping-cost">Standard Shipping Cost ($)</Label>
              <Input
                id="shipping-cost"
                type="number"
                step="0.01"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="free-shipping-threshold">Free Shipping Threshold ($)</Label>
              <Input
                id="free-shipping-threshold"
                type="number"
                step="0.01"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={() => handleSaveSettings('Shipping')}>Save Shipping Settings</Button>
        </CardContent>
      </Card>

      {/* User Management Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" /> User Management
          </CardTitle>
          <CardDescription>Control user registration and authentication features.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-registration">Enable New User Registration</Label>
            <Switch
              id="enable-registration"
              checked={enableUserRegistration}
              onCheckedChange={setEnableUserRegistration}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-2fa">Enable Two-Factor Authentication (for Admins)</Label>
            <Switch
              id="enable-2fa"
              checked={enableTwoFactorAuth}
              onCheckedChange={setEnableTwoFactorAuth}
            />
          </div>
          <Button onClick={() => handleSaveSettings('User Management')}>Save User Settings</Button>
        </CardContent>
      </Card>

      {/* Email Templates (Example) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-500" /> Email Templates
          </CardTitle>
          <CardDescription>Customize automated emails sent to customers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="welcome-email">Welcome Email Content</Label>
            <Textarea
              id="welcome-email"
              rows={5}
              value={welcomeEmailContent}
              onChange={(e) => setWelcomeEmailContent(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Use HTML for rich content. Variables like <code>{`{{userName}}`}</code> can be used.
            </p>
          </div>
          <Button onClick={() => handleSaveSettings('Email Templates')}>Save Email Template</Button>
        </CardContent>
      </Card>
    </div>
  );
}