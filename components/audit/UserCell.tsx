import React from 'react';

interface UserCellProps {
    username: string;
    img_url?: string | null;
    email?: string;
}

export const UserCell: React.FC<UserCellProps> = ({ username, img_url, email }) => {
    // Helper to get initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    return (
        <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
                {img_url ? (
                    <img
                        src={img_url}
                        alt={username}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500 font-semibold text-xs">
                        {getInitials(username || 'U')}
                    </div>
                )}
            </div>

            {/* Name & Email */}
            <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700 leading-tight">
                    {username || 'Desconhecido'}
                </span>
                {email && (
                    <span className="text-xs text-slate-400 leading-tight">
                        {email}
                    </span>
                )}
            </div>
        </div>
    );
};
