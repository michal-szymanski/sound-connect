import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(main)/user/$id')({
    component: RouteComponent
});

function RouteComponent() {
    return <div>Hello "/user/$id"!</div>;
}
