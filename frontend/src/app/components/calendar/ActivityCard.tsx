import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { Activity } from '@/app/types/calendar';

interface ActivityCardProps {
    activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full ${activity.color} mt-1`}></div>
                <div className="flex-1">
                    <h3 className="font-semibold text-dark">{activity.title}</h3>
                    <div className="flex items-center gap-1 mt-1 text-sm text-primary">
                        <Clock size={14} />
                        <span>{activity.time}</span>
                    </div>
                    {activity.location && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-primary">
                            <MapPin size={14} />
                            <span>{activity.location}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}