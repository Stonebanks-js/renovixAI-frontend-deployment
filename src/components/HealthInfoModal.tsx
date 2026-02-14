import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Heart, User, Calendar, Activity, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface HealthInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HealthInfoModal = ({ isOpen, onClose }: HealthInfoModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    maritalStatus: '',
    dateOfBirth: '',
    phone: '',
    emergencyContact: ''
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in first to save your information.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: formData.fullName,
          gender: formData.gender,
          marital_status: formData.maritalStatus,
          date_of_birth: formData.dateOfBirth,
          phone: formData.phone || null,
          emergency_contact: formData.emergencyContact || null,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        toast({
          title: "Error saving information",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Health information saved!",
          description: "Your information has been saved successfully.",
        });
        
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving your information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/auth');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Welcome to Renovix AI</DialogTitle>
              <DialogDescription>
                Please provide your basic health information to get started
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Full Name *
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Enter your full name"
              required
              className="mt-2"
            />
          </div>

          {/* Gender */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary" />
              Gender *
            </Label>
            <Select onValueChange={(value) => handleChange('gender', value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select your gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Marital Status */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-primary" />
              Marital Status *
            </Label>
            <Select onValueChange={(value) => handleChange('maritalStatus', value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select your marital status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
                <SelectItem value="separated">Separated</SelectItem>
                <SelectItem value="domestic-partnership">Domestic Partnership</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date of Birth */}
          <div>
            <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Date of Birth *
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              required
              className="mt-2"
            />
          </div>

          {/* Phone Number */}
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter your phone number"
              className="mt-2"
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <Input
              id="emergencyContact"
              value={formData.emergencyContact}
              onChange={(e) => handleChange('emergencyContact', e.target.value)}
              placeholder="Emergency contact name and phone"
              className="mt-2"
            />
          </div>

          {/* Privacy Notice */}
          <div className="bg-secondary/10 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Privacy Notice:</strong> Your health information is encrypted and stored securely. 
              We comply with HIPAA regulations and will never share your data without consent.
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            variant="hero" 
            size="lg" 
            className="w-full"
            disabled={loading || !user}
          >
            {loading ? 'Saving...' : 'Submit Information'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HealthInfoModal;