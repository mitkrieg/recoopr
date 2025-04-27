"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"
import { redirect, useRouter } from "next/navigation"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DatePickerWithRange } from "@/components/DateRangePicker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { getSession } from "@/lib/auth/session"
// import { useCurrentUser } from "@/utils/getCurrentUser"
import useSWR from 'swr';

type Theater = {
  id: number
  name: string
  venueSlug: string | null
}

const FormSchema = z.object({
  name: z.string().min(2, {
    message: "Production name must be at least 2 characters.",
  }),
  performanceDates: z.object({
    from: z.date(),
    to: z.date(),
  }),
  venue: z.string().min(2, {
    message: "Venue must be at least 2 characters.",
  }),
  capitalization: z.object({
    capitalization: z.number().min(0).max(1000000000)
  })
})

const fetcher = (url: string) => fetch(url).then(res => res.json())

function InputForm() {
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { data: user, error, isLoading: isUserLoading } = useSWR('/api/user', fetcher);
  
  useEffect(() => {
    async function fetchTheaters() {
      try {
        const response = await fetch('/api/theaters');
        if (!response.ok) {
          throw new Error('Failed to fetch theaters');
        }
        const data = await response.json();
        setTheaters(data);
      } catch (error) {
        console.error('Error fetching theaters:', error);
        toast('Failed to load theaters', {
          description: 'Please try again later',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTheaters();
  }, []);
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      performanceDates: {
        from: new Date(),
        to: new Date(),
      },
      venue: "",
      capitalization: {
        capitalization: 100,
      },
    },
  })

  if (!user) {
    redirect('/sign-in');
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (isUserLoading) {
    return <div>Loading...</div>;
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/productions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          startDate: data.performanceDates.from.toISOString(),
          endDate: data.performanceDates.to.toISOString(),
          capitalization: data.capitalization.capitalization,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create production');
      }

      const result = await response.json();
      toast.success('Production created successfully');
      router.push(`/productions/scenario?productionId=${result.id}`);
    } catch (error) {
      console.error('Error creating production:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create production');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Production Name</FormLabel>
              <FormControl>
                <Input placeholder="West Side Story" {...field} />
              </FormControl>
              {/* <FormDescription>
                This is the name of the production.
              </FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="performanceDates"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Performance Dates</FormLabel>
              <FormControl>
                <DatePickerWithRange
                  className="w-full"
                  initialDates={field.value}
                  onDateChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="venue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>Loading theaters...</SelectItem>
                    ) : theaters.length === 0 ? (
                      <SelectItem value="none" disabled>No theaters available</SelectItem>
                    ) : (
                      theaters.map((theater) => (
                        <SelectItem key={theater.id} value={theater.id.toString()}>
                          {theater.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="capitalization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capitalization</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1 text-gray-500">$</span>
                  <Input 
                    type="number" 
                    value={field.value.capitalization || ''}
                    onChange={(e) => field.onChange({ capitalization: Number(e.target.value) || 0 })}
                    className="pl-7 placeholder:text-gray-400"
                    placeholder="100"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem> 
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Submit"}
        </Button>
      </form>
    </Form>
  )
}

export default function CreateProductionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create a New Production</h1>
      <p className="text-gray-500">Create a new production for your theater.</p>
      <InputForm />
    </div>
  )
}
