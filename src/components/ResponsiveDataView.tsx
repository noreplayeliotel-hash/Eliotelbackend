import React from 'react';

interface ResponsiveDataViewProps {
    data: any[];
    renderCard: (item: any) => React.ReactNode;
    renderTable: () => React.ReactNode;
}

const ResponsiveDataView: React.FC<ResponsiveDataViewProps> = ({ 
    data, 
    renderCard, 
    renderTable 
}) => {
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (isMobile) {
        return (
            <div className="mobile-cards-container">
                {data.length === 0 ? (
                    <div className="empty-state-card">
                        <p>Aucune donnée disponible</p>
                    </div>
                ) : (
                    data.map((item) => (
                        <div key={item._id} className="mobile-data-card">
                            {renderCard(item)}
                        </div>
                    ))
                )}
            </div>
        );
    }

    return <>{renderTable()}</>;
};

export default ResponsiveDataView;
